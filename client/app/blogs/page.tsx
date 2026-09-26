'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchPublishedBlogs } from '@/lib/redux/slices/blogSlice';

export default function BlogsPage() {
  const dispatch = useAppDispatch();
  const { blogs, loading, error } = useAppSelector((state) => state.blogs);

  useEffect(() => {
    dispatch(fetchPublishedBlogs());
  }, [dispatch]);

  return (
    <>
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Blogs & Articles</span>
        </div>
      </div>

      {/* ── Main Blogs Feed Container ── */}
      <div className="blog-page-container">
        {loading && blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
            Loading blog posts from database...
          </div>
        ) : error && blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#d90429' }}>
            {error}
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            No blog articles published yet. Check back soon!
          </div>
        ) : (
          <div className="blog-feed">
            {blogs.map((post) => {
              const formattedDate = post.created_at
                ? new Date(post.created_at).toLocaleDateString()
                : 'Recent';

              return (
                <article className="blog-item" key={post.id}>
                  <Link href={`/blogs/${post.id}`} className="blog-item__img-wrap">
                    <img
                      src={post.image || '/blog-1.png'}
                      alt={post.title}
                      className="blog-item__img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Link>

                  <div className="blog-item__content">
                    <h2 className="blog-item__title">
                      <Link href={`/blogs/${post.id}`}>{post.title}</Link>
                    </h2>
                    <div className="blog-item__meta">
                      {formattedDate} | {post.author || 'admin admin'}
                    </div>
                    <p className="blog-item__excerpt">{post.excerpt}</p>
                    <Link href={`/blogs/${post.id}`} className="blog-item__read-more">
                      Read more &rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
