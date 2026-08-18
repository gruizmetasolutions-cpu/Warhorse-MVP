<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class ContactController extends ResourceController
{
    protected $format = 'json';

    public function create()
    {
        $rules = [
            'name' => 'required|min_length[3]',
            'email' => 'required|valid_email',
            'service' => 'required',
            'message' => 'permit_empty'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = $this->request->getJSON(true);

        $service = $data['service'] ?? '';
        $emailDestination = 'Helpdesk@warhorsebrokerage.com';

        // Lógica condicional (Enrutamiento inteligente)
        switch ($service) {
            case 'ftl':
            case 'ltl':
            case 'special':
                $emailDestination = 'Quotes@WarhorseBrokerage.com';
                break;
            case 'managed':
                $emailDestination = 'SafetyandCompliance@warhorsebrokerage.com';
                break;
        }

        // Aquí se implementaría el servicio de email (e.g. \Config\Services::email())
        log_message('info', 'New contact request received. Routing to: ' . $emailDestination);
        log_message('info', 'Payload: ' . json_encode($data));

        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Request submitted successfully',
            'routed_to' => $emailDestination
        ]);
    }
}
