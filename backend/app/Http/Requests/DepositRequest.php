<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:100'],
            'card_number' => ['required', 'string'],
            'exp_month' => ['nullable', 'string'],
            'exp_year' => ['nullable', 'string'],
            'cvc' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'The minimum deposit amount is 1.00 PKR (100 Paisa).',
            'card_number.required' => 'Payment card number is required.',
        ];
    }
}
