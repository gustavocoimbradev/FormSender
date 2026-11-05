<?php

namespace App\Http\Controllers;

class FormController extends Controller {

    public function store(\Illuminate\Http\Request $request) {

        $form = new \App\Models\Form;
        $form->name = $request->name;
        $form->save();

        return response([
            'data' => [
                'name' => $request->name
            ]
        ], 201);
    }

}