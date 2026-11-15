import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function IconMaskable() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#C85A7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 260,
            fontWeight: 700,
            color: '#FDF6F8',
            fontStyle: 'italic',
            lineHeight: 1,
          }}
        >
          Y
        </div>
      </div>
    ),
    { ...size }
  );
}
