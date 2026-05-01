(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasWebGL = !!window.WebGLRenderingContext;

  function initHero(root) {
    var canvas = root.querySelector('.speedx-crystal-canvas');
    var content = root.querySelector('.speedx-hero__content');
    if (!canvas) return;
    if (typeof THREE === 'undefined' || !hasWebGL) {
      root.classList.add('speedx-no-webgl');
      return;
    }

    root.classList.add('speedx-js');

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }
      root.classList.remove('speedx-js');
      root.classList.add('speedx-no-webgl');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var group = new THREE.Group();
    scene.add(group);

    var geometry = new THREE.IcosahedronGeometry(1.15, 5);
    var material = new THREE.MeshPhysicalMaterial({
      color: 0xffcd0e,
      emissive: 0x9a6e00,
      emissiveIntensity: 1,
      roughness: 0.2,
      metalness: 0.15,
      transmission: 0.05,
      clearcoat: 1
    });

    var crystal = new THREE.Mesh(geometry, material);
    group.add(crystal);

    var glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffcd0e, transparent: true, opacity: 0.2 });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(1.65, 32, 32), glowMaterial);
    group.add(glow);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var key = new THREE.PointLight(0xffcd0e, 1.4, 20);
    key.position.set(2, 2, 3);
    scene.add(key);

    var pointer = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var holdStart = 0;
    var holdTriggered = false;
    var isHolding = false;
    var visibilityActive = true;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(220, rect.width);
      var h = Math.max(220, rect.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function setHoldState(active) {
      isHolding = active;
      canvas.classList.toggle('speedx-is-holding', active);
      if (active) {
        holdStart = performance.now();
      }
    }

    function onMove(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      target.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      target.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    }

    canvas.addEventListener('pointerdown', function (e) {
      canvas.setPointerCapture(e.pointerId);
      onMove(e.clientX, e.clientY);
      setHoldState(true);
    });

    canvas.addEventListener('pointermove', function (e) {
      onMove(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerup', function () {
      setHoldState(false);
    });

    canvas.addEventListener('pointercancel', function () {
      setHoldState(false);
    });

    var observer = new IntersectionObserver(function (entries) {
      visibilityActive = entries[0] && entries[0].isIntersecting;
    }, { threshold: 0.08 });
    observer.observe(root);

    if (!reducedMotion && window.gsap && content) {
      gsap.to(content, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.25 });
    } else if (content) {
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    }

    var pos = geometry.attributes.position;
    var base = new Float32Array(pos.array);

    var hasRenderedFrame = false;

    function animate(t) {
      requestAnimationFrame(animate);
      if (!visibilityActive) return;

      pointer.x += (target.x - pointer.x) * 0.08;
      pointer.y += (target.y - pointer.y) * 0.08;

      var holdAmount = isHolding ? 1 : 0;
      var wobble = holdAmount ? 0.2 : 0.08;
      var distortion = holdAmount ? 0.18 : 0.08;

      for (var i = 0; i < pos.count; i++) {
        var ix = i * 3;
        var ox = base[ix];
        var oy = base[ix + 1];
        var oz = base[ix + 2];
        var n = Math.sin(t * 0.0018 + ox * 3.2 + oy * 2.6 + oz * 2.9);
        var amp = 1 + n * distortion;
        pos.array[ix] = ox * amp;
        pos.array[ix + 1] = oy * amp;
        pos.array[ix + 2] = oz * amp;
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();

      group.rotation.y += reducedMotion ? 0.003 : 0.005;
      group.rotation.x = Math.sin(t * 0.00055) * wobble + pointer.y * 0.22;
      group.position.x = pointer.x * 0.28;
      group.position.y = pointer.y * 0.22;

      var targetScale = isHolding ? 1.08 : 1;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      glow.scale.lerp(new THREE.Vector3(isHolding ? 1.08 : 1, isHolding ? 1.08 : 1, isHolding ? 1.08 : 1), 0.1);

      material.emissiveIntensity += ((isHolding ? 1.8 : 1) - material.emissiveIntensity) * 0.08;
      glowMaterial.opacity += ((isHolding ? 0.33 : 0.2) - glowMaterial.opacity) * 0.08;

      if (isHolding && !holdTriggered && (t - holdStart) > 1500) {
        holdTriggered = true;
        if (!reducedMotion && window.gsap && content) {
          gsap.fromTo(content, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out' });
          gsap.to(group.scale, { x: 1.16, y: 1.16, z: 1.16, duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut' });
        }
      }

      if (!isHolding) {
        holdTriggered = false;
      }

      renderer.render(scene, camera);
      if (!hasRenderedFrame) {
        root.classList.add('speedx-rendered');
        hasRenderedFrame = true;
      }
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(animate);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var heroes = document.querySelectorAll('[data-speedx-crystal-hero]');
    heroes.forEach(initHero);
  });
})();
