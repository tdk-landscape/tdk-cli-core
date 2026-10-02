<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController
{
    #[Route('/health', name: 'health')]
    public function health(): JsonResponse
    {
        return new JsonResponse(['status' => 'ok', 'service' => 'symfony']);
    }

    #[Route('/', name: 'root')]
    public function root(): JsonResponse
    {
        return new JsonResponse(['service' => 'symfony', 'endpoints' => ['/health']]);
    }
}
