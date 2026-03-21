declare module "@paper-design/shaders-react" {
  import * as React from "react";

  export type MeshGradientProps = {
    className?: string;
    colors?: [string, string, string, string] | string[];
    speed?: number;
  };

  export const MeshGradient: React.ComponentType<MeshGradientProps>;
}
