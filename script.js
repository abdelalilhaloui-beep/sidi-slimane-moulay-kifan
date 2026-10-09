
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("posts-container");
  if (!container) return;

  container.innerHTML = "<p>جاري تحميل التدوينات...</p>";

  const repository =
    "https://api.github.com/repos/abdelalilhaloui-beep/sidi-slimane-moulay-kifan";
  function getField(metadata, name) {
    const match = metadata.match(
      new RegExp("^" + name + ":\\s*(.*)$", "m")
    );

    return match
      ? match[1].trim().replace(/^["']|["']$/g, "")
      : "";
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  try {
    const response = await fetch(
      `${repository}/contents/content/posts?ref=main`
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API: ${response.status} - ${response.statusText}`
      );
    }

    const files = await response.json();
    console.log("GitHub files:", files);
    const markdownFiles = files.filter(file =>
      file.type === "file" && file.name.endsWith(".md")
    );

    const posts = await Promise.all(
      markdownFiles.map(async file => {
        const result = await fetch(file.download_url);
        if (!result.ok) return null;

        const markdown = await result.text();
        const parts = markdown.split(/^---\s*$/m);

        if (parts.length < 3) return null;

        const metadata = parts[1];

        if (getField(metadata, "published").toLowerCase() !== "true") {
          return null;
        }

        return {
          file: file.name,
          title: getField(metadata, "title") || "تدوينة محلية",
          category: getField(metadata, "category"),
          date: getField(metadata, "date"),
          summary: getField(metadata, "summary")
        };
      })
    );

    const publishedPosts = posts
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (publishedPosts.length === 0) {
      container.innerHTML = "<p>لا توجد تدوينات منشورة حاليًا.</p>";
      return;
    }

    container.innerHTML = publishedPosts.map(post => `
      <article class="post-card">
        <div class="post-content">
          <small class="post-date">
            ${escapeHTML(post.category)}
            ${escapeHTML(post.date)}
          </small>

          <h3>${escapeHTML(post.title)}</h3>

          <p>${escapeHTML(post.summary)}</p>

          <a href="/pages/post.html?file=${encodeURIComponent(post.file)}">
            اقرأ المزيد
          </a>
        </div>
      </article>
    `).join("");

  } catch (error) {
    console.error("Posts loading error:", error);
    container.innerHTML =
      "<p>تعذر تحميل التدوينات حاليًا. يرجى المحاولة لاحقًا.</p>";
  }
});
