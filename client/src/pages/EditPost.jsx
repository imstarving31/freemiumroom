import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function EditPost() {
  const { id } = useParams();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--sans)' }}>
      <Link to="/manage-posts" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', textDecoration: 'none', fontWeight: '600', marginBottom: '24px' }}>
        <ArrowLeft size={16} />
        Quay lại quản lý tin đăng
      </Link>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Chỉnh sửa tin đăng</h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>ID bài đăng: <code>{id}</code></p>
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#475569' }}>
          Form chỉnh sửa tin đăng đang được xây dựng. Các trường dữ liệu sẽ sớm được hiển thị tại đây.
        </div>
      </div>
    </div>
  );
}
