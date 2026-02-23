<?php

namespace App\Swagger;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *   title="E-Twitter API",
 *   version="1.0.0",
 *   description="Swagger (OpenAPI) documentation for E-Twitter backend."
 * )
 *
 * @OA\Server(
 *   url="http://127.0.0.1:8000",
 *   description="Local server"
 * )
 *
 * @OA\SecurityScheme(
 *   securityScheme="bearerAuth",
 *   type="http",
 *   scheme="bearer",
 *   bearerFormat="JWT"
 * )
 */
class SwaggerSpec {}