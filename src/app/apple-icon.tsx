import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #C85A7E 0%, #A83C5E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 120,
            fontWeight: 700,
            color: '#FDF6F8',
            fontStyle: 'italic',
            lineHeight: 1,
            marginTop: -10,
          }}
        >
          Y
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 35,
            right: 35,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#FDF6F8',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
