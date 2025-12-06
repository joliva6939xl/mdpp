// web/src/components/ControlPanel.tsx
import React from "react";
import ControlPanelContent from "./ControlPanelContent";

// Re-exportamos los tipos para mantener compatibilidad
export type {
  ControlPanelProps,
  UserTarget,
  SelectionMode,
} from "./ControlPanelContent";

type Props = React.ComponentProps<typeof ControlPanelContent>;

const ControlPanel: React.FC<Props> = (props) => {
  return <ControlPanelContent {...props} />;
};

export default ControlPanel;
