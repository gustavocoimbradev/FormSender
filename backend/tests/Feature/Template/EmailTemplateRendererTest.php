<?php

declare(strict_types=1);

use App\Models\FormSubmission;
use App\Models\Template;
use App\Support\EmailTemplateRenderer;

function renderWith(string $html, string $subject = 'Subject', ?FormSubmission $submission = null): array
{
    return app(EmailTemplateRenderer::class)->renderSubmission(
        new Template(['name' => 'T', 'subject' => $subject, 'html' => $html]),
        $submission ?? makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com']),
    );
}

it('fills the form name, date, origin and ip', function (): void {
    $submission = makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com']);
    $submission->forceFill(['origin' => 'meusite.com', 'ip' => '203.0.113.9', 'created_at' => '2026-11-05 15:42:00'])->save();

    $rendered = renderWith('<p>{{form_name}}|{{date}}|{{origin}}|{{ip}}</p>', 'S', $submission->fresh());

    expect($rendered['html'])->toBe('<p>Contact|2026-11-05 15:42|meusite.com|203.0.113.9</p>');
});

it('accepts spaces inside the braces and leaves unknown variables as they are', function (): void {
    $rendered = renderWith('{{ form_name }} {{nope}} {{field.missing}}');

    expect($rendered['html'])->toBe('Contact {{nope}} ');
});

it('fills single fields by name and their labels', function (): void {
    $rendered = renderWith('{{label.name}}: {{field.name}} / {{label.email}}: {{field.email}}');

    expect($rendered['html'])->toBe('Name: Jane / Email: jane@example.com');
});

it('shows checkboxes as Yes or No and keeps line breaks in long text', function (): void {
    $submission = makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com', 'newsletter' => true, 'message' => "one\ntwo"]);

    $rendered = renderWith('{{field.newsletter}}|{{field.message}}', 'S', $submission);

    expect($rendered['html'])->toBe("Yes|one<br />\ntwo");
});

it('never lets submitted values inject html', function (): void {
    $submission = makeSubmission(['name' => '<script>alert(1)</script>', 'email' => 'jane@example.com']);

    $rendered = renderWith('{{field.name}} {{fields}}', 'S', $submission);

    expect($rendered['html'])->not->toContain('<script>')->toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
});

it('builds a styled table with every field, in the form order, for {{fields}}', function (): void {
    $rendered = renderWith('{{fields}}');

    expect($rendered['html'])
        ->toContain('<table')
        ->toContain('Jane')
        ->toContain('jane@example.com')
        ->and(strpos($rendered['html'], 'Name'))->toBeLessThan(strpos($rendered['html'], 'Email'));
});

it('fills the subject too, as plain text on a single line', function (): void {
    $submission = makeSubmission(['name' => "Jane\nDoe", 'email' => 'jane@example.com']);

    $rendered = renderWith('<p>x</p>', 'New: {{form_name}} from {{field.name}} <b>', $submission);

    expect($rendered['subject'])->toBe('New: Contact from Jane Doe <b>');
});

it('renders a sample, for the preview, with no submission', function (): void {
    $rendered = app(EmailTemplateRenderer::class)->renderSample('Hi {{form_name}}', '<p>{{form_name}}</p>{{fields}}');

    expect($rendered['subject'])->toBe('Hi Contact form')
        ->and($rendered['html'])->toContain('<p>Contact form</p>')->toContain('Maria Souza')->toContain('maria@company.com');
});

it('has a default template that looks like the panel and uses the variables', function (): void {
    $default = Template::defaultTemplate();

    expect($default->is_default)->toBeTrue()
        ->and($default->name)->toBe('Default')
        ->and($default->subject)->toContain('{{form_name}}')
        ->and($default->html)->toContain('{{fields}}')->toContain('#07070d')->toContain('#8b6bff')
        ->and(Template::defaultTemplate()->is($default))->toBeTrue()
        ->and(Template::where('is_default', true)->count())->toBe(1);
});

it('has a default template made only of what email clients understand', function (): void {
    $html = Template::defaultTemplate()->html;

    expect($html)->not->toContain('display:flex')->not->toContain('display: flex')
        ->not->toContain('display:grid')->not->toContain('<script')->not->toContain('position:')
        ->toContain('role="presentation"')->toContain('bgcolor=');
});

it('shows a block only when its field has a value', function (): void {
    $template = '[{{#field.message}}Message: {{field.message}}{{/field.message}}]';

    expect(renderWith($template, 'S', makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com', 'message' => 'Hi']))['html'])->toBe('[Message: Hi]')
        ->and(renderWith($template)['html'])->toBe('[]')
        ->and(renderWith($template, 'S', makeSubmission(['name' => 'Jane', 'email' => 'jane@example.com', 'message' => '  ']))['html'])->toBe('[]');
});

it('never lets a submitted value open or close a block', function (): void {
    $submission = makeSubmission(['name' => '{{/field.message}}{{#field.message}}', 'email' => 'jane@example.com', 'message' => 'x']);

    expect(renderWith('{{#field.message}}{{field.name}}{{/field.message}}', 'S', $submission)['html'])
        ->toContain('{{/field.message}}{{#field.message}}');
});

it('leaves out of {{fields}} the answers the template already placed one by one', function (): void {
    $html = renderWith('{{field.name}}|{{fields}}')['html'];

    expect(substr_count($html, 'Jane'))->toBe(1)
        ->and($html)->toContain('jane@example.com')
        ->not->toContain('>Name<');
});

it('renders no table at all when every answer was placed one by one', function (): void {
    expect(renderWith('{{field.name}}{{field.email}}{{fields}}')['html'])->toBe('Janejane@example.com');
});

describe('default template', function (): void {
    function renderDefault(array $data): array
    {
        return app(EmailTemplateRenderer::class)->renderSubmission(Template::defaultTemplate(), makeSubmission($data));
    }

    it('highlights the sender, the message and a reply button, and lists any other answer', function (): void {
        $html = renderDefault(['name' => 'Jane', 'email' => 'jane@example.com', 'message' => "Hello\nthere", 'topic' => 'Sales'])['html'];

        expect($html)->toContain('Jane')
            ->toContain('href="mailto:jane@example.com')
            ->toContain("Hello<br />\nthere")
            ->toContain('Topic')->toContain('Sales')
            ->not->toContain('{{');
    });

    it('drops the message block when the optional message was left empty', function (): void {
        $html = renderDefault(['name' => 'Jane', 'email' => 'jane@example.com'])['html'];

        expect($html)->toContain('Jane')->not->toContain('>Message<')->not->toContain('{{');
    });

    it('still reads well for a form that has no name, email or message', function (): void {
        $form = App\Models\Form::factory()->create(['name' => 'Survey', 'fields' => [['name' => 'score', 'label' => 'Score', 'type' => 'number']]]);
        $submission = app(App\Actions\Submission\StoreFormSubmissionAction::class)->execute($form, ['score' => 9]);

        $html = app(EmailTemplateRenderer::class)->renderSubmission(Template::defaultTemplate(), $submission)['html'];

        expect($html)->toContain('Score')->toContain('9')->not->toContain('mailto:')->not->toContain('{{');
    });
});
