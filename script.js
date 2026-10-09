document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("posts-container");
    if (!container) return;

    try {
        const response = await fetch("/content/posts/2026-10-09-alhaj-qdwr-bad-altsaqtat-almtryh-trq-mtdhrrh-wmkhawf-alsaknh.md");

        if (!response.ok) {
            throw new Error("تعذر تحميل التدوينة");
        }

        const markdown = await response.text();
        const title = markdown.match(/title:\s*["']?([^"\n]+)["']?/);
        const summary = markdown.match(/summary:\s*([\s\S]*?)(?=\nimage:|\npublished:|---)/);

        container.innerHTML = `
      <article class="post-card">
        <div class="post-content">
          <h3>${title ? title[1].replace(/["']/g, "") : "آخر تدوينة"}</h3>
          <p>${summary ? summary[1].replace(/\n/g, " ").trim() : "اقرأ آخر مستجدات المنطقة."}</p>
          <a href="/content/posts/2026-10-09-alhaj-qdwr-bad-altsaqtat-almtryh-trq-mtdhrrh-wmkhawf-alsaknh.md">اقرأ المزيد</a>
        </div>
      </article>
    `;
    } catch (error) {
        container.innerHTML = "<p>تعذر تحميل التدوينات حاليًا.</p>";
        console.error(error);
    }
});