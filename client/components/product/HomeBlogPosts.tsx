'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchPublishedBlogs } from '@/lib/redux/slices/blogSlice';

export default function HomeBlogPosts() {
  const dispatch = useAppDispatch();
  const { blogs, loading } = useAppSelector((state) => state.blogs);

  useEffect(() => {
    dispatch(fetchPublishedBlogs());
  }, [dispatch]);

  // Display top 3 latest published blog posts
  const latestBlogs = blogs.slice(0, 3);

  return (
    <section className="home-blog-posts">
      <div className="home-blog-posts__container">
        <h2 className="home-blog-posts__title">Blog posts</h2>

        {loading && blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#666', fontSize: '0.9rem' }}>
            Loading latest blog articles...
          </div>
        ) : latestBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '0.9rem' }}>
            No blog posts available at the moment.
          </div>
        ) : (
          <div className="home-blog-posts__grid">
            {latestBlogs.map((post) => {
              const formattedDate = post.created_at
                ? new Date(post.created_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <article key={post.id} className="home-blog-card">
                  <div className="home-blog-card__img-wrap">
                    <Link href={`/blogs/${post.id}`}>
                      <img
                        src={
                          post.image ||
                          '/blog-1.png'
                        }
                        alt={post.title}
                        className="home-blog-card__img"
                        style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                      />
                    </Link>
                    <button type="button" className="home-blog-card__zoom-btn" aria-label="Quick action">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="home-blog-card__body">
                    <div className="home-blog-card__meta">
                      <span>{formattedDate}</span>
                      <span className="sep">|</span>
                      <span className="author">{post.author || 'admin admin'}</span>
                    </div>

                    <h3 className="home-blog-card__title">
                      <Link href={`/blogs/${post.id}`}>{post.title}</Link>
                    </h3>

                    <p className="home-blog-card__excerpt">{post.excerpt}</p>

                    <Link href={`/blogs/${post.id}`} className="home-blog-card__read-more">
                      READ MORE &nbsp;&rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
