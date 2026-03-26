(() => {
  const setActiveContent = (section, activeId) => {
    section.querySelectorAll('.content-tabs__content').forEach(el => {
      el.classList.remove('content-tabs__content--active');
      el.classList.remove('animate');
    });
    const activeContent = section.querySelector(`[data-content-tab-id="${activeId}"].content-tabs__content`);
    if (activeContent) {
      activeContent.classList.add('content-tabs__content--active');
      setTimeout(() => activeContent.classList.add('animate'), 100);
    }
  };

  const toggleTab = section => {
    const tabs = section.querySelectorAll('.content-tabs__tab');
    tabs.forEach(tab => {
      const currentId = tab.dataset.contentTabId;
      tab.addEventListener('click', event => {
        if (!event.currentTarget.classList.contains('content-tabs__tab--active')) {
          tabs.forEach(el => el.classList.remove('content-tabs__tab--active'));
          tab.classList.add('content-tabs__tab--active');
          setActiveContent(section, currentId);
        }
      });
      tab.addEventListener('keydown', event => {
        if (!event.currentTarget.classList.contains('content-tabs__tab--active') && event.key === 'Enter') {
          tabs.forEach(el => el.classList.remove('content-tabs__tab--active'));
          tab.classList.add('content-tabs__tab--active');
          setActiveContent(section, currentId);
        }
      });
    });
  };

  const setWidthForAfter = section => {
    const wrapper = section.querySelector('.content-tabs__tabs-wrapper');
    if (!wrapper) return;
    const setVariable = el => {
      el.style.setProperty('--wrapper-border-width', `${el.scrollWidth}px`);
    };
    requestAnimationFrame(() => setVariable(wrapper));
    new ResizeObserver(entries => entries.forEach(entry => setVariable(entry.target))).observe(wrapper);
  };

  const initSection = section => {
    if (!section || !section.classList.contains('content-tabs-section')) return;
    toggleTab(section);
    setWidthForAfter(section);
  };

  const initAll = () => document.querySelectorAll('.content-tabs-section').forEach(initSection);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', event => {
    const section = event.target.querySelector('.content-tabs-section') || event.target;
    initSection(section);
  });
})();
