import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 320,
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
