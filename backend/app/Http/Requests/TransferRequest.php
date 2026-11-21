<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_email' => ['required', 'email'],
            'amount' => ['required', 'integer', 'min:100'],
            'mpin' => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_email.required' => 'Recipient email address is required.',
            'amount.min' => 'The minimum transfer amount is 1.00 PKR (100 Paisa).',
            'mpin.required' => '4-digit MPIN is required to authorize transfers.',
            'mpin.regex' => 'MPIN must consist of exactly 4 numeric digits.',
        ];
    }
}
