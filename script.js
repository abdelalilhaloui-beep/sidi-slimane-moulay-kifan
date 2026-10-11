
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("posts-container");
  if (!container) return;

  container.innerHTML =
    '<p class="posts-loading">جاري تحميل التدوينات...</p>';

  const repository =
    "https://api.github.com/repos/abdelalilhaloui-beep/sidi-slimane-moulay-kifan";

  function getField(metadata, name) {
    const line = metadata.match(
      new RegExp("^" + name + ":\\s*(.*)$", "mi")
    );
    return line ? line[1].trim().replace(/^['"]|['"]$/g, "") : "";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getImage(metadata, body) {
    for (const key of [
      "image", "thumbnail", "cover",
      "featured_image", "image_url", "photo"
    ]) {
      const value = getField(metadata, key);
      if (value) return value;
    }

    const markdownImage = body.match(
      /!\[[^\]]*\]\((<?)([^)\s]+)>?(?:\s+[^)]*)?\)/
    );
    if (markdownImage) return markdownImage[2];

    const htmlImage = body.match(
      /<img\b[^>]*\bsrc=["']([^"']+)["']/i
    );
    return htmlImage ? htmlImage[1] : "";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("ar-MA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  try {
    const response = await fetch(
      `${repository}/contents/content/posts?ref=main`
    );

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    const files = await response.json();

    const markdownFiles = files.filter(file =>
      file.type === "file" && file.name.toLowerCase().endsWith(".md")
    );

    const posts = await Promise.all(markdownFiles.map(async file => {
      const result = await fetch(file.download_url);
      if (!result.ok) return null;

      const markdown = await result.text();
      const match = markdown.match(
        /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/
      );

      if (!match) return null;

      const metadata = match[1];
      const body = markdown.slice(match[0].length);

      if (getField(metadata, "published").toLowerCase() !== "true") {
        return null;
      }

      const summary = getField(metadata, "summary") ||
        body.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/[#*_`>]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);

      return {
        file: file.name,
        title: getField(metadata, "title") || "تدوينة محلية",
        category: getField(metadata, "category"),
        date: getField(metadata, "date"),
        summary,
        image: getImage(metadata, body)
      };
    }));

    const publishedPosts = posts
      .filter(Boolean)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!publishedPosts.length) {
      container.innerHTML =
        '<p class="posts-empty">لا توجد تدوينات منشورة حالياً.</p>';
      return;
    }

    container.innerHTML = publishedPosts.map(post => {
      const postUrl =
        `pages/post.html?file=${encodeURIComponent(post.file)}`;

      const imageMarkup = post.image
        ? `<a class="post-image-link" href="${escapeHTML(postUrl)}">
             <img class="post-image"
                  src="${escapeHTML(post.image)}"
                  alt="${escapeHTML(post.title)}"
                  loading="lazy"
                  onerror="this.parentElement.outerHTML='<div class=&quot;post-image-placeholder&quot;>📰</div>'">
           </a>`
        : '<div class="post-image-placeholder">📰</div>';

      return `
        <article class="post-card">
          ${imageMarkup}
          <div class="post-content">
            <div class="post-meta">
              ${post.category
          ? `<span class="post-category">${escapeHTML(post.category)}</span>`
          : ""}
              ${post.date
          ? `<time class="post-date">${escapeHTML(formatDate(post.date))}</time>`
          : ""}
            </div>
            <h3>
              <a href="${escapeHTML(postUrl)}">${escapeHTML(post.title)}</a>
            </h3>
            <p>${escapeHTML(post.summary)}</p>
            <a class="post-read-more" href="${escapeHTML(postUrl)}">
              اقرأ المزيد ←
            </a>
          </div>
        </article>`;
    }).join("");

  } catch (error) {
    console.error("Posts loading error:", error);
    container.innerHTML =
      '<p class="posts-error">تعذر تحميل التدوينات. تحقق من الاتصال ومستودع GitHub.</p>';
  }
});
