import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  skeletonClassName?: string
}

export function ArtworkLazyImage({
  src,
  onLoad,
  className,
  alt = '',
  skeletonClassName,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    setLoaded(false)
  }, [src])
  const sk =
    skeletonClassName ??
    'pointer-events-none absolute inset-0 z-[1] size-full min-h-[12rem] rounded-sm'
  return (
    <>
      {!loaded ? <Skeleton className={sk} /> : null}
      <img
        {...rest}
        src={src}
        alt={alt}
        className={className}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
      />
    </>
  )
}
