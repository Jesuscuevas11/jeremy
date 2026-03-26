(()=>{const initCursor=section=>{if(!section||!section?.classList.contains("image-gallery-section"))return;const box=section.querySelector(".image-gallery__wrapper"),cursorEl=section.querySelector(".image-gallery__cursor"),sliderEl=box.querySelector(".image-gallery__slider");if(!box||!cursorEl||Number(box.getAttribute("data-slides-count"))<=1)return;const handleMouseMove=event=>{cursorEl.classList.add("active"),cursorEl.classList.remove("disabled");const sectionRect=box.getBoundingClientRect(),sectionWidth=sectionRect.width,sectionCenterX=sectionRect.left+sectionWidth/2;if(!sliderEl?.swiper)return;const slider=sliderEl.swiper,x=event.clientX-sectionRect.left-18,y=event.clientY-sectionRect.top-18;event.clientX<sectionCenterX?(cursorEl.classList.add("prev"),cursorEl.classList.remove("next"),box.getAttribute("data-loop")!=="true"&&slider.isBeginning&&cursorEl.classList.add("disabled")):(cursorEl.classList.remove("prev"),cursorEl.classList.add("next"),box.getAttribute("data-loop")!=="true"&&slider.isEnd&&cursorEl.classList.add("disabled")),cursorEl.style.left=`${x}px`,cursorEl.style.top=`${y}px`},handleMouseLeave=()=>{cursorEl.classList.remove("active"),cursorEl.classList.remove("disabled")},handleClick=event=>{if(event.target.classList.contains("swiper-pagination"))return;const sectionRect=box.getBoundingClientRect(),sectionWidth=sectionRect.width,sectionCenterX=sectionRect.left+sectionWidth/2,sliderEl2=box.querySelector(".image-gallery__slider");if(!sliderEl2?.swiper)return;const slider=sliderEl2.swiper,hasNextSlide=box.getAttribute("data-loop")==="true"?!0:!slider.isEnd,hasPrevSlide=box.getAttribute("data-loop")==="true"?!0:!slider.isBeginning;event.clientX<sectionCenterX&&hasPrevSlide?slider.slidePrev():event.clientX>=sectionCenterX&&hasNextSlide&&slider.slideNext()};let isCursorInit=!1;window.innerWidth>=990&&window.matchMedia("(pointer:fine)").matches&&(sliderEl.addEventListener("mousemove",handleMouseMove),sliderEl.addEventListener("mouseleave",handleMouseLeave),sliderEl.addEventListener("click",handleClick),isCursorInit=!0),new ResizeObserver(entries=>{entries.forEach(entry=>{entry.contentRect.width>=990?isCursorInit||(sliderEl.addEventListener("mousemove",handleMouseMove),sliderEl.addEventListener("mouseleave",handleMouseLeave),sliderEl.addEventListener("click",handleClick),isCursorInit=!0):isCursorInit&&(sliderEl.removeEventListener("mousemove",handleMouseMove),sliderEl.removeEventListener("mouseleave",handleMouseLeave),sliderEl.removeEventListener("click",handleClick),isCursorInit=!1)})}).observe(section)},initSlider=section=>{if(!section||!section?.classList.contains("image-gallery-section"))return;const box=section.querySelector(".image-gallery__wrapper"),sliderEl=box.querySelector(".image-gallery__slider");if(!box||!sliderEl||Number(box.getAttribute("data-slides-count"))<=1)return;const swiperParams={speed:1e3,centeredSlides:!0,slidesPerView:"auto",allowTouchMove:!0,mousewheel:{forceToAxis:!0},spaceBetween:8,breakpoints:{990:{spaceBetween:16,grabCursor:box.getAttribute("data-navigation")!=="true",allowTouchMove:box.getAttribute("data-navigation")!=="true"}}};if(box.getAttribute("data-autoplay")==="true"&&(swiperParams.autoplay={disableOnInteraction:!0}),box.getAttribute("data-loop")==="true"&&(swiperParams.loop=!0,swiperParams.loopPreventsSliding=!1),box.getAttribute("data-pagination")==="true"){const paginationEl=box.querySelector(".swiper-pagination");paginationEl&&(swiperParams.pagination={el:paginationEl,type:"bullets",clickable:!0})}new Swiper(sliderEl,swiperParams)};

  var init = function() {
    document.querySelectorAll('.image-gallery-section').forEach(function(section) {
      initSlider(section);
      initCursor(section);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function(event) {
    var section = event.target.querySelector('.image-gallery-section') || event.target;
    initSlider(section);
    initCursor(section);
  });
})();
