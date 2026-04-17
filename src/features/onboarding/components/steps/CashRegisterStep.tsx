import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { CashRegisterStepData } from '../../types';
import { cashRegisterStepSchema } from '../../schemas/onboarding.schema';

interface CashRegisterStepProps {
  defaultValues?: Partial<CashRegisterStepData>;
  onSubmit: (data: CashRegisterStepData) => void;
}

export function CashRegisterStep({ defaultValues, onSubmit }: CashRegisterStepProps) {
  const form = useForm<CashRegisterStepData>({
    resolver: zodResolver(cashRegisterStepSchema),
    defaultValues: defaultValues || {
      cashRegisterName: '',
      initialCash: 0,
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
          name="cashRegisterName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la caja</FormLabel>
              <FormControl>
                <Input placeholder="Caja Principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="initialCash"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Efectivo inicial en caja</FormLabel>
              <FormControl>
                <CurrencyInput 
                  value={field.value} 
                  onChange={field.onChange} 
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}