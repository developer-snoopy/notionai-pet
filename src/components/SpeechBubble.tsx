import { usePetStore } from "../stores/petStore";

export default function SpeechBubble() {
  const message = usePetStore((s) => s.message);

  if (!message) return null;

  return <div className="speech-bubble">{message}</div>;
}
