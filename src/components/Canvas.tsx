import { forwardRef } from 'react'

export interface ICanvasProps
  extends React.DetailedHTMLProps<
    React.CanvasHTMLAttributes<HTMLCanvasElement>,
    HTMLCanvasElement
  > {
  density?: number
}
const Canvas = forwardRef<HTMLCanvasElement, ICanvasProps>(
  ({ density, style, width, height, ...props }, ref) => {
    const actualDensity = density ?? 1
    const pixelWidth = width == null ? undefined : Number(width) * actualDensity
    const pixelHeight =
      width == null ? undefined : Number(width) * actualDensity

    return (
      <canvas
        ref={ref}
        width={pixelWidth}
        height={pixelHeight}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    )
  },
)

export default Canvas
