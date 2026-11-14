import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#C85A7E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FDF6F8',
          fontSize: 120,
          fontFamily: 'serif',
          fontWeight: 'bold',
        }}
      >
        Y
      </div>
    ),
    { ...size }
  );
}
