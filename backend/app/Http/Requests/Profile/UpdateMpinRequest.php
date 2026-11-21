<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMpinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $hasMpin = $this->user()->has_mpin;

        return [
            'mpin' => ['required', 'string', 'regex:/^[0-9]{4}$/'],
            'mpin_confirmation' => ['required', 'same:mpin'],
            'current_password' => [$hasMpin ? 'required' : 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'mpin.regex' => 'The MPIN must be exactly 4 numeric digits.',
            'mpin_confirmation.same' => 'The MPIN confirmation does not match.',
            'current_password.required' => 'Your current account password is required to change your MPIN.',
        ];
    }
}
