import { Button } from "@/components/ui/button";

export function EnviarEmailButton({ onSend }: { onSend: () => void }) {
  return <Button onClick={onSend}>Enviar por email</Button>;
}
