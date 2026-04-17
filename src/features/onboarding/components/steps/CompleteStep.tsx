import { CheckCircle2 } from 'lucide-react';

interface CompleteStepProps {
  companyName: string;
}

export function CompleteStep({ companyName }: CompleteStepProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        ¡{companyName} está lista!
      </h3>
      <p className="text-gray-500 mb-6">
        Tu empresa ha sido configurada. Ahora puedes empezar a usar Ventuki.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <p className="text-sm font-medium text-gray-700 mb-2">Próximos pasos:</p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Agrega tus productos al catálogo</li>
          <li>• Configura tus clientes y proveedores</li>
          <li>• Abre tu primera caja</li>
          <li>• ¡Empieza a vender!</li>
        </ul>
      </div>
    </div>
  );
}