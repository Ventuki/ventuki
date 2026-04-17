import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { WarehouseStepData } from '../../types';
import { warehouseStepSchema } from '../../schemas/onboarding.schema';

interface WarehouseStepProps {
  defaultValues?: Partial<WarehouseStepData>;
  onSubmit: (data: WarehouseStepData) => void;
}

export function WarehouseStep({ defaultValues, onSubmit }: WarehouseStepProps) {
  const form = useForm<WarehouseStepData>({
    resolver: zodResolver(warehouseStepSchema),
    defaultValues: defaultValues || {
      warehouseName: '',
      warehouseDescription: '',
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
          name="warehouseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del almacén</FormLabel>
              <FormControl>
                <Input placeholder="Almacén Principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warehouseDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del almacén..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}