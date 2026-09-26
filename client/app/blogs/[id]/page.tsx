'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchBlogByIdOrSlug } from '@/lib/redux/slices/blogSlice';

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const { selectedBlog: post, loading, error } = useAppSelector((state) => state.blogs);

  const postId = params?.id;

  useEffect(() => {
    if (postId) {
      dispatch(fetchBlogByIdOrSlug(postId));
    }
  }, [dispatch, postId]);

  const formattedDate = post?.created_at
    ? new Date(post.created_at).toLocaleDateString()
    : 'Recent';

  return (
    <>
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/blogs">Blogs</Link>
          <span className="sep">/</span>
          <span className="current">{post?.title || 'Blog Detail'}</span>
        </div>
      </div>

      {/* ── Blog Detail Content Container ── */}
      <div className="blog-detail-container">
        {loading && !post ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
            Loading article details...
          </div>
        ) : error && !post ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#d90429' }}>
            {error}
          </div>
        ) : !post ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            Blog post not found. <Link href="/blogs" style={{ textDecoration: 'underline' }}>Back to All Blogs</Link>
          </div>
        ) : (
          <>
            <h1 className="blog-detail__title">{post.title}</h1>
            <div className="blog-detail__meta">
              {formattedDate} | {post.author || 'admin admin'}
            </div>
            <hr className="blog-detail__divider" />

            <div className="blog-detail__img-wrap">
              <img
                src={post.image || '/blog-1.png'}
                alt={post.title}
                className="blog-detail__img"
                style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: '4px' }}
              />
            </div>

            <div className="blog-detail__body" style={{ marginTop: '24px', lineHeight: '1.8' }}>
              {/* Render content paragraphs */}
              {post.content ? (
                post.content.split('\n\n').map((para, index) => (
                  <p key={index} style={{ marginBottom: '16px' }}>
                    {para}
                  </p>
                ))
              ) : (
                <p>{post.excerpt}</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
