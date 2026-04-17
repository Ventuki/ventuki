import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CompanyStepData } from '../../types';
import { companyStepSchema } from '../../schemas/onboarding.schema';

interface CompanyStepProps {
  defaultValues?: Partial<CompanyStepData>;
  onSubmit: (data: CompanyStepData) => void;
}

export function CompanyStep({ defaultValues, onSubmit }: CompanyStepProps) {
  const form = useForm<CompanyStepData>({
    resolver: zodResolver(companyStepSchema),
    defaultValues: defaultValues || {
      companyName: '',
      companyEmail: '',
      companyPhone: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la empresa</FormLabel>
              <FormControl>
                <Input placeholder="Mi Empresa S.A. de C.V." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contacto@miempresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(55) 1234-5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}