// pages/blog/myPosts.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import BlogPostCard from "@/components/blog/BlogPostCard";
import Pagination from "@/components/Pagination";
import { BLOG_POST_LIMIT } from "@/constants";
import NoBlogPosts from "@/components/errors/NoBlogPosts";
import { validSortByFields, validSortOrders } from "@/constants";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Type for the Author
interface BlogPostAuthor {
    id: number;
    userName: string;
    avatar: string;
    role: string;
  }
  
  // Type for Tags
  interface BlogPostTag {
    id: number;
    name: string;
  }
  
  // Type for Code Templates
  interface BlogPostTemplate {
    id: number;
    title: string;
  }
  
  // Main BlogPost Type
  interface BlogPost {
    id: number;
    title: string;
    description: string;
    isHidden: boolean;
    hiddenReason?: string; // Optional as it can be null
    createdAt: string; // DateTime as an ISO string
    updatedAt: string; // DateTime as an ISO string
    upvoteCount: number;
    downvoteCount: number;
  
    // Relations
    author: BlogPostAuthor;
    tags: BlogPostTag[];
    templates: BlogPostTemplate[];
  }
  
  // Type for the API Response
  interface BlogPostListResponse {
    blogPosts: BlogPost[]; // List of blog posts
    postCount: number; // Total number of posts
  }

const BlogPostList = () => {
  const TAG_LIMIT = 10;
  const CODE_TEMPLATE_LIMIT = 5;
  const router = useRouter();

  const [data, setData] = useState<BlogPostListResponse>({blogPosts: [], postCount: 0});
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("upvoteCount");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  
  // Stores all possible tags and templates from DB
  const [tags, setTags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Filters applied on blog posts
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [titleFilter, setTitleFilter] = useState<string>('');
  const [descriptionFilter, setDescriptionFilter] = useState<string>('');
  const [showFilterForm, setShowFilterForm] = useState<boolean>(false);

  // Pagination state
  const [tagPage, setTagPage] = useState<number>(1);
  const [templatePage, setTemplatePage] = useState<number>(1);
  const [userId, setUserId]=useState<number>(0);

  const handleAuthen = async () => {
    try {
      const response = await fetch('/api/token/isUserAuth', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        cache: 'no-store',
      });
  
      if (response.ok) {
        const data = await response.json();
        setUserId(data.id);
        return;
      } else {
        const refreshResp = await fetch('/api/User/Refresh', {
          method: 'GET',
          headers: {
            authorization: `Bearer ${localStorage.getItem("refreshToken")}`,
          },
          cache: 'no-store',
        });
  
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          localStorage.setItem("accessToken", data.accessToken);
          setUserId(data.id);
          router.push('/blog/myPosts');
          return;
        } else {
          router.push('/login');
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTagPageChange = (page: number) => {
    setTagPage(page);
  }

  const handleTemplatePageChange = (page: number) => {
      setTemplatePage(page);
  }

  const handleTagChange = (tagName: string) => {
      setSelectedTags((prevTags) =>
        (prevTags || []).includes(tagName) ? (prevTags || []).filter((name) => name !== tagName) : [...(prevTags || []), tagName]
      );
    };

  const handleTemplateChange = (templateTitle: string) => {
    setSelectedTemplates((prevTemplates) =>
      (prevTemplates || []).includes(templateTitle)
        ? (prevTemplates || []).filter((title) => title !== templateTitle)
        : [...(prevTemplates || []), templateTitle]
    );
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "sortBy") {
      setSortBy(value);
      router.push({
        pathname: router.pathname,
        query: { ...router.query, sortBy: value },
      }, undefined, { shallow: true });
    }
    if (name === "sortOrder") {
      setSortOrder(value);
      router.push({
        pathname: router.pathname,
        query: { ...router.query, sortOrder: value },
      }, undefined, { shallow: true });
    }
    fetchPosts();
  };

  const fetchPosts = async () => {
    let url = `/api/blog/user?page=${page}`;
      
    const queryParams = new URLSearchParams();
    queryParams.append('userId', `${userId}`);
    queryParams.append('limit', router.query.limit as string || BLOG_POST_LIMIT.toString());
    queryParams.append('sortBy', (router.query.sortBy as string) || "upvoteCount");
    queryParams.append('sortOrder', (router.query.sortOrder as string) || "desc");
    queryParams.append('countPosts', "true");

    if (titleFilter !== '') {
      queryParams.append('title', titleFilter);
    }
    if (descriptionFilter !== '') {
      queryParams.append('description', descriptionFilter);
    }
    if (selectedTags && selectedTags.length > 0) {
      queryParams.append('tags', selectedTags.join(','));
    }
    if (selectedTemplates && selectedTemplates.length > 0) {
      queryParams.append('templates', selectedTemplates.join(','));
    }
  
    if (queryParams.toString()) {
      url += '&' + queryParams.toString();
    }
  
    try {
      const res = await fetch(url, { method: 'GET', headers: { authorization: `Bearer ${localStorage.getItem("accessToken")}` }, cache: 'no-store' });
      if (res.status === 200) {
        const data = await res.json();
        setData({ blogPosts: data.blogPosts, postCount: data.postCount });
      } else {
        setData({ blogPosts: [], postCount: 0 });
        throw new Error('Failed to fetch posts');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  useEffect(() => {
    if (!router.isReady) return;
    handleAuthen();
  }, [router.isReady]);

  useEffect(() => {
    if (userId === 0 || userId === undefined) return;
    if (router.isReady) {
      // Sync URL with filter state
      const query: Record<string, string> = { page: page.toString() };
      if (titleFilter) query.title = titleFilter;
      if (descriptionFilter) query.description = descriptionFilter;
      if (selectedTags.length > 0) query.tags = selectedTags.join(',');
      if (selectedTemplates.length > 0) query.templates = selectedTemplates.join(',');
      
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    }
  }, [page, titleFilter, descriptionFilter, selectedTags, selectedTemplates]);
  
useEffect(() => {
  if (userId === 0 || userId === undefined) return;
  if (router.isReady) {
    // Fetch posts only when necessary filters change
    fetchPosts();
  }
}, [router.isReady, userId, page, titleFilter, descriptionFilter, selectedTags, selectedTemplates]);



useEffect(() => {
  if (userId === 0 || userId === undefined) return;
  if (!router.isReady) return; // Wait until the router is ready
  
  // Initialize filters from URL query
  setTitleFilter(typeof router.query.title === 'string' ? router.query.title : '');
  setDescriptionFilter(typeof router.query.description === 'string' ? router.query.description : '');
  setPage(typeof router.query.page === 'string' ? parseInt(router.query.page) : 1);
  
  if (typeof router.query.tags === 'string') {
    setSelectedTags(router.query.tags.split(',') || []);
  }

  if (typeof router.query.templates === 'string') {
    setSelectedTemplates(router.query.templates.split(',') || []);
  }
}, [router.isReady, router.query.title, router.query.description, router.query.page, router.query.tags, router.query.templates]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Tags and Templates
        const [tagsResponse, templatesResponse] = await Promise.all([
          fetch('/api/tag/getAll', {cache: "no-store"}),
          fetch('/api/CodeTemplate/getAll', {cache: "no-store"}),
        ]);

        if (!templatesResponse.ok) throw new Error("Failed to fetch templates");
        const templateRes = await templatesResponse.json();
        if (templateRes) {
          setTemplates(templateRes.map((template: any) => (template.title)));
        }

        if (!tagsResponse.ok) throw new Error("Failed to fetch tags");
        const tagRes = await tagsResponse.json();
        if (tagRes) {
          setTags(tagRes.map((tag: any) => (tag.name)));
        }      
      } catch (error: any) {
        setError(error.message);
      }
    };
  
    fetchData();
  }, []);

  
  const handleFilterFormClose = () => {
    setShowFilterForm(false);
  }

  // If there was an error, show an error message
  if (error) {
    alert(`Error ${error}`);
    setError("");
  }


  // If there's data, render the blog posts
  return (
    <div className="blog-post-list">
      <h2 className='text-4xl font-semibold mb-4'>Blog Posts</h2>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4 mr-4">
              <p className="text-xl">Sort Controls:</p>
            <select
              name="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              className="p-2 border rounded-md bg-white shadow text-gray-900"
            >
              <option disabled value="">
                Sort by
              </option>
              {validSortByFields.map((field) => (
                <option key={field} value={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </option>
              ))}
            </select>

            <select
              name="sortOrder"
              value={sortOrder}
              onChange={handleSortChange}
              className="p-2 border rounded-md bg-white shadow text-gray-900"
            >
              <option disabled value="">
                Order
              </option>
              {validSortOrders.map((order) => (
                <option key={order} value={order}>
                  {order.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-4 mr-4">
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Title Filter..."
              className="p-2 border rounded-md"
            />
            <input
              type="text"
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              placeholder="Description Filter..."
              className="p-2 border rounded-md"
            />
            <button
              type="button"
              onClick={() => setShowFilterForm(true)}
              className="flex px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
            >
              <FunnelIcon className="h-6 w-6 mr-2" />
              Filter
            </button>
          </div>
        </div>
      {showFilterForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg space-y-6 overflow-y-auto max-h-[80vh]">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Filter by Tags and Templates</h2>
              <button
                type="button"
                onClick={() => handleFilterFormClose()}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
            </div>

            {/* Tags Section */}
            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.slice((tagPage - 1) * TAG_LIMIT, tagPage * TAG_LIMIT).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagChange(tag)}
                    className={`px-3 py-1 text-center text-sm rounded-lg focus:outline-none ${
                      selectedTags?.includes(tag) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    } hover:bg-blue-300 transition`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-6">
                <Pagination currentPage={tagPage} totalPages={Math.ceil(tags.length / TAG_LIMIT)} onPageChange={handleTagPageChange} />
              </div>
            </div>

            {/* Templates Section */}
            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">Templates</label>
              <div className="grid grid-cols-1 gap-2">
                {templates.slice((templatePage - 1) * CODE_TEMPLATE_LIMIT, templatePage * CODE_TEMPLATE_LIMIT).map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => handleTemplateChange(template)}
                    className={`w-full py-2 px-4 text-center rounded-lg focus:outline-none ${
                      selectedTemplates?.includes(template) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    } hover:bg-blue-300 transition`}
                  >
                    {template}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-6">
                <Pagination currentPage={templatePage} totalPages={Math.ceil(templates.length / CODE_TEMPLATE_LIMIT)} onPageChange={handleTemplatePageChange} />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center space-x-4">
                    <button
          onClick={() => {
            setTitleFilter('');
            setDescriptionFilter('');
            setSelectedTags([]);
            setSelectedTemplates([]);
            setPage(1);
            fetchPosts(); // Ensure the list is refreshed
          }}
          className="px-4 py-2 bg-gray-300 text-black rounded-md shadow hover:bg-gray-400 transition"
        >
          Clear Filters
        </button>
        <button
              type="button"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={() => handleFilterFormClose()}
            >
              Done
            </button>
            </div>
          </div>
        </div>
      )}

      {data.blogPosts.length === 0 ? <NoBlogPosts /> :
      data.blogPosts.map((post) => (
    <BlogPostCard
      key={post.id}
      id={post.id}
      title={post.title}
      description={post.description}
      authorId={post.author.id}
      authorUsername={post.author.userName}
      authorAvatarUrl={post.author.avatar}
      createdAt={post.createdAt}
      upvoteCount={post.upvoteCount}
      downvoteCount={post.downvoteCount}
      tags={post.tags.map((tag) => tag.name)}
      isHidden={post.isHidden}
      hiddenReason={post.hiddenReason}
    />
  ))}
      <div className="flex justify-center">
      <Pagination
              currentPage={router.query.page ? parseInt(router.query.page as string) : 1}
              totalPages={Math.ceil(data.postCount / BLOG_POST_LIMIT)}
              onPageChange={(page: number) =>
                router.push({
                  pathname: "/blog/myPosts",
                  query: { ...router.query, page },
                })
              }
            />
      </div>
    </div>
  );
};

export default BlogPostList;
  