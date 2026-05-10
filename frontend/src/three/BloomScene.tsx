import { ReactNode, Suspense } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface Props {
  children: ReactNode;
  intensity?: number;
  vignette?: boolean;
}

/** Wraps children with bloom + vignette post-processing. Falls back gracefully. */
export default function BloomScene({ children, intensity = 0.7, vignette = true }: Props) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <EffectComposer>
          <Bloom
            intensity={intensity}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.6}
            mipmapBlur
          />
          {vignette ? (
            <Vignette eskil={false} offset={0.25} darkness={0.85} blendFunction={BlendFunction.NORMAL} />
          ) : (
            // Render an inert pass when vignette disabled (EffectComposer needs at least one child)
            <Vignette offset={0} darkness={0} />
          )}
        </EffectComposer>
      </Suspense>
    </>
  );
}
