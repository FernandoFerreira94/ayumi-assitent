/* Bolha, fiel ao Mascot.tsx: 4 círculos, borda furta-cor, olhos #3B22B8, bochechas.
   Cada círculo tem a classe .lobe-N na borda e no corpo, para poder separar e juntar. */
(function () {
  var L = [[158.4, 274.4, 81.6], [321.6, 281.2, 74.8], [240, 206.4, 102], [240, 308.4, 81.6]];
  window.Bolha = function (p) {
    var rim = L.map(function (c, i) { return '<circle class="lobe lobe-' + i + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>'; }).join("");
    var body = L.map(function (c, i) { return '<circle class="lobe lobe-' + i + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + (c[2] - 9) + '"/>'; }).join("");
    return '<svg class="bolha-svg" viewBox="70 95 340 305" overflow="visible" aria-hidden="true"><defs>' +
      '<radialGradient id="' + p + 'b" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#FDFCFF"/><stop offset="1" stop-color="#E6DEFF"/></radialGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6D4AFF"/><stop offset=".25" stop-color="#B9A6FF"/><stop offset=".5" stop-color="#FF8FB1"/><stop offset=".75" stop-color="#E5547F"/><stop offset="1" stop-color="#8E73FF"/></linearGradient>' +
      '<radialGradient id="' + p + 'c"><stop offset="0" stop-color="#FF8FB1" stop-opacity=".75"/><stop offset="1" stop-color="#FF8FB1" stop-opacity="0"/></radialGradient>' +
      '</defs><g fill="url(#' + p + 'r)">' + rim + '</g><g fill="url(#' + p + 'b)">' + body + '</g>' +
      '<g class="shine"><ellipse cx="185" cy="150" rx="34" ry="13" transform="rotate(-34 185 150)" fill="#fff" opacity=".9"/><circle cx="228" cy="138" r="6" fill="#fff" opacity=".9"/></g>' +
      '<g class="face"><circle cx="172" cy="296" r="24" fill="url(#' + p + 'c)"/><circle cx="308" cy="296" r="24" fill="url(#' + p + 'c)"/>' +
      '<g class="eyes" fill="#3B22B8"><ellipse class="eye" cx="202" cy="254" rx="15" ry="24"/><ellipse class="eye" cx="278" cy="254" rx="15" ry="24"/>' +
      '<circle cx="197" cy="246" r="5.5" fill="#fff"/><circle cx="273" cy="246" r="5.5" fill="#fff"/></g>' +
      '<path class="mouth" d="M249.7 293.05A12 12 0 0 1 230.3 293.05" fill="none" stroke="#3B22B8" stroke-linecap="round" stroke-width="6"/>' +
      '<path class="mouth-open" d="M226 290 Q240 316 254 290 Z" fill="#3B22B8" opacity="0"/></g></svg>';
  };
  /* olhos seguem o cursor; piscada periódica e ao toque */
  window.bolhaAlive = function (host) {
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var eyes = host.querySelector(".eyes");
    addEventListener("pointermove", function (e) {
      var r = host.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      var d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 320);
      eyes.setAttribute("transform", "translate(" + (dx / d * 10 * m).toFixed(1) + " " + (dy / d * 8 * m).toFixed(1) + ")");
    }, { passive: true });
    function blink() {
      if (reduce || !window.gsap) return;
      gsap.fromTo(host.querySelectorAll(".eye"), { scaleY: 1 }, { scaleY: .1, transformOrigin: "50% 50%", duration: .08, yoyo: true, repeat: 1 });
    }
    host.addEventListener("click", function () {
      blink();
      if (window.gsap && !reduce) gsap.fromTo(host.querySelector(".bolha-svg"), { scaleX: 1, scaleY: 1 }, { scaleX: 1.12, scaleY: .9, duration: .14, yoyo: true, repeat: 1, transformOrigin: "50% 100%" });
    });
    setInterval(function () { if (!document.hidden) blink(); }, 4200);
  };
  /* campo de bolhas furta-cor em canvas, reage ao cursor */
  window.bubbleField = function (cv, opt) {
    opt = opt || {};
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cx = cv.getContext("2d"), W, H, B = [], m = { x: -999, y: -999 }, on = true, speed = 1;
    function nb(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 40, r: 4 + Math.random() * (opt.max || 22), v: .2 + Math.random() * .5, p: Math.random() * 6.3 }; }
    function size() {
      var d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
      B = []; for (var i = 0; i < Math.round(W / (opt.density || 60)); i++) B.push(nb(true));
    }
    function draw(t) {
      cx.clearRect(0, 0, W, H);
      for (var i = 0; i < B.length; i++) {
        var b = B[i];
        if (!reduce) { b.y -= b.v * speed; b.x += Math.sin(t * .001 + b.p) * .3; }
        var dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { b.x += dx / d * 2; b.y += dy / d * 2; }
        if (b.y < -50) B[i] = nb(false);
        var g = cx.createLinearGradient(b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r);
        g.addColorStop(0, "rgba(109,74,255,.55)"); g.addColorStop(.5, "rgba(255,143,177,.55)"); g.addColorStop(1, "rgba(142,115,255,.55)");
        cx.strokeStyle = g; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.stroke();
        cx.fillStyle = "rgba(255,255,255,.75)"; cx.beginPath(); cx.arc(b.x - b.r * .35, b.y - b.r * .35, Math.max(1, b.r * .18), 0, 6.283); cx.fill();
      }
    }
    function loop(t) { if (on) draw(t); if (!reduce) requestAnimationFrame(loop); }
    size(); addEventListener("resize", size);
    addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; }).observe(cv);
    requestAnimationFrame(loop); if (reduce) draw(0);
    return { setSpeed: function (s) { speed = s; } };
  };
  /* scroll suave quando a lib carregar */
  window.smooth = function () {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !window.Lenis || !window.gsap) return;
    var l = new Lenis({ lerp: .09 });
    l.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { l.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
  };
})();
