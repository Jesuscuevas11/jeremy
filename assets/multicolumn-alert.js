(function () {
  var initSlider = function (section) {
    var box = section.querySelector('.multicolumn');
    var slider = section.querySelector('.swiper--multicolumn');
    if (!slider) return;
    slider.querySelectorAll('.multicolumn-card').forEach(function (slide) {
      slide.classList.add('swiper-slide');
    });
    var spaceBetween = box.getAttribute('data-space-between')
      ? Number(box.getAttribute('data-space-between')) * 10
      : 24;
    var spaceBetweenMobile = slider.classList.contains('swiper--multicolumn--visible-overflow') ? 16 : 20;
    var nextBtn = slider.querySelector('.multicolumn-button--next');
    var prevBtn = slider.querySelector('.multicolumn-button--prev');
    var scrollbar = slider.querySelector('.swiper-scrollbar');
    new Swiper(slider, {
      loop: false,
      slidesPerView: 'auto',
      spaceBetween: spaceBetweenMobile,
      speed: 800,
      mousewheel: { forceToAxis: true },
      watchSlidesProgress: true,
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
        disabledClass: 'multicolumn-button--disabled'
      },
      scrollbar: { el: scrollbar, grabCursor: true, draggable: true, hide: false },
      breakpoints: { 576: { spaceBetween: spaceBetween } }
    });
  };

  var destroySlider = function (section) {
    var slider = section.querySelector('.swiper--multicolumn');
    if (slider && slider.swiper) slider.swiper.destroy(true, true);
  };

  var initMulticolumn = function (section) {
    if (!section) return;
    var box = section.querySelector('.multicolumn');
    if (!box) return;
    var enableMobile = box.getAttribute('data-enable-mobile-slider') === 'true';
    if (!enableMobile) return;
    var mq = window.matchMedia('(max-width: 575px)');
    var toggle = function (e) {
      if (e.matches) {
        initSlider(section);
      } else {
        destroySlider(section);
      }
    };
    toggle(mq);
    mq.addEventListener('change', toggle);
  };

  var init = function () {
    document.querySelectorAll('.multicolumn-alert-section').forEach(initMulticolumn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (event.target.querySelector('.multicolumn-alert-section')) {
      initMulticolumn(event.target);
    }
  });
})();
