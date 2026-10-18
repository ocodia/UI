// Focused browser assertions; scripts and fixtures are trusted repository content.
async function runAccordionChecks(load, frame) {
  const passed=[];
  const check=(value,message)=>{ if(!value) throw new Error(message); passed.push(message); };
  const settle=()=>new Promise(resolve=>setTimeout(resolve,80));
  let win=await load('../docs/previews/accordion-0.html'), doc=win.document;
  const key=(node,value,options={})=>{const event=new win.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...options});node.dispatchEvent(event);return event.defaultPrevented;};
  let group=doc.querySelector('ui-accordion'), items=[...group.children], summaries=items.map(item=>item.firstElementChild);
  check(group.hasAttribute('data-ui-ready') && win.getComputedStyle(group).display==='block' && items[0].open && !items[1].open,'Automatic setup preserves native expansion and block composition.');
  check(!win.customElements.get('ui-accordion') && !win.customElements.get('ui-accordion-item') && !group.querySelector('[aria-expanded],[aria-controls],[role],[tabindex]'),'No registration, duplicate ARIA or roving tabindex.');
  check(!group.hasAttribute('data-ui'),'Element name alone opts into Accordion.');
  const plain=doc.createElement('details');plain.innerHTML='<summary>Plain disclosure</summary><p>Native content</p>';group.after(plain);win.UI.enhance(plain);
  check(!plain.hasAttribute('data-ui-ready') && !key(plain.firstElementChild,'ArrowDown'),'Plain details remain outside Accordion ownership.');plain.remove();
  summaries[0].focus();
  for(const [value,index] of [['ArrowDown',1],['End',2],['ArrowDown',0],['ArrowUp',2],['Home',0]]) check(key(doc.activeElement,value) && doc.activeElement===summaries[index],value+': DOM-order navigation and wrap.');
  check(items[0].open && !items[1].open && !items[2].open,'Navigation leaves expansion unchanged.');
  for(const attribute of ['hidden','inert']) {items[1].setAttribute(attribute,'');summaries[0].focus();key(summaries[0],'ArrowDown');check(doc.activeElement===summaries[2],'Skip '+attribute+' item.');items[1].removeAttribute(attribute);}
  summaries[0].focus();
  for(const options of [{shiftKey:true},{altKey:true},{ctrlKey:true},{metaKey:true},{isComposing:true}]) check(!key(summaries[0],'ArrowDown',options) && doc.activeElement===summaries[0],'Modified/composing keys remain native.');
  const prevent=event=>event.preventDefault();summaries[0].addEventListener('keydown',prevent,{capture:true});key(summaries[0],'ArrowDown');check(doc.activeElement===summaries[0],'Prevented keys are ignored.');summaries[0].removeEventListener('keydown',prevent,{capture:true});
  for(const value of ['ArrowLeft','ArrowRight','Escape','Enter',' ']) check(!key(summaries[0],value),value+': native/unrelated keys are not intercepted.');
  win.UI.enhance(group);win.UI.enhance(doc);key(summaries[0],'ArrowDown');check(doc.activeElement===summaries[1],'Repeated enhancement keeps one navigation owner.');
  const link=items[0].querySelector('a');items[0].open=true;link.focus();items[0].open=false;await settle();check(doc.activeElement===summaries[0],'Collapse recovers content focus to summary.');
  items[0].open=true;link.focus();items[0].open=false;summaries[2].focus();await settle();check(doc.activeElement===summaries[2],'Queued collapse does not steal focus.');
  items[0].open=true;link.focus();items[0].open=false;items[0].open=true;await settle();check(doc.activeElement===link,'Coalesced close/reopen reads current state.');
  summaries[0].focus();let focusCalls=0;const nativeFocus=win.HTMLElement.prototype.focus;win.HTMLElement.prototype.focus=function(...args){focusCalls++;return nativeFocus.apply(this,args);};win.location.hash='equipment';await settle();win.HTMLElement.prototype.focus=nativeFocus;check(items[1].open && focusCalls===0,'Fragment reveals content without scripted focus movement.');
  items[1].open=false;win.UI.enhance(group);await settle();check(!items[1].open,'Refresh does not replay the fragment.');
  win.UI.destroy(group);check(!group.hasAttribute('data-ui-ready') && items[0].open && !items[1].open,'Destroy preserves expansion.');summaries[0].focus();check(!key(summaries[0],'ArrowDown'),'Destroy releases key listeners.');
  win.UI.enhance(group);await settle();check(items[1].open,'Reinstallation reveals current fragment.');group.setAttribute('data-ui-ready','application');win.UI.destroy(group);check(group.getAttribute('data-ui-ready')==='application','Cleanup preserves later scalar writes.');group.removeAttribute('data-ui-ready');win.history.replaceState(null,'',win.location.pathname);win.UI.enhance(group);
  const late=doc.createElement('details');late.innerHTML='<summary>Late section</summary><p>More content</p>';group.append(late);await settle();check(!group.hasAttribute('data-ui-ready'),'Late items invalidate ownership.');win.UI.enhance(group);check(group.hasAttribute('data-ui-ready'),'Explicit refresh accepts late items.');
  const replacement=doc.createElement('summary');replacement.textContent='Updated';late.firstElementChild.replaceWith(replacement);await settle();check(!group.hasAttribute('data-ui-ready'),'Summary replacement releases stale listeners.');win.UI.enhance(group);
  group.remove();await settle();check(!group.hasAttribute('data-ui-ready'),'Removal releases ownership.');doc.querySelector('main').append(group);await settle();check(!group.hasAttribute('data-ui-ready'),'Reinsertion requires enhance.');win.UI.enhance(group);
  const foreign=doc.implementation.createHTMLDocument('Other');foreign.body.append(foreign.adoptNode(group));await settle();check(!group.hasAttribute('data-ui-ready'),'Adoption releases ownership.');doc.querySelector('main').append(doc.adoptNode(group));win.UI.enhance(group);
  const invalid=doc.createElement('div');doc.querySelector('main').append(invalid);
  for(const markup of ['', '<details><p>No summary</p></details>', '<details><summary>One</summary><summary>Two</summary></details>', '<details name=""><summary>Empty name</summary></details>', '<details name="mixed"><summary>One</summary></details><details><summary>Two</summary></details>', '<details role="tab"><summary>Conflict</summary></details>', '<details><summary><button type="button">Action</button></summary></details>']) {
    invalid.innerHTML='<ui-accordion>'+markup+'</ui-accordion>';win.UI.enhance(invalid);check(!invalid.firstElementChild.hasAttribute('data-ui-ready'),'Invalid/incomplete markup retains baseline.');
  }invalid.remove();
  win=await load('../docs/previews/accordion-1.html');doc=win.document;group=doc.querySelector('ui-accordion');items=[...group.children];check(group.hasAttribute('data-ui-ready') && items.every(item=>!item.open),'Exclusive group may start all closed.');
  items[0].open=true;items[1].open=true;await settle();check('name' in win.HTMLDetailsElement.prototype ? !items[0].open && items[1].open : items.every(item=>item.open),'Native grouping or multiple-open fallback owns expansion.');
  const outside=doc.createElement('details');outside.setAttribute('name','route-options');outside.innerHTML='<summary>Outside collision</summary>';doc.querySelector('main').append(outside);await settle();check(!group.hasAttribute('data-ui-ready'),'Document-wide name collision invalidates enhancement.');outside.remove();win.UI.enhance(group);
  items[0].setAttribute('aria-expanded','false');await settle();check(!group.hasAttribute('data-ui-ready') && items[0].getAttribute('aria-expanded')==='false','Conflicting ARIA is preserved and enhancement released.');
  win=await load('../docs/previews/accordion-2.html');doc=win.document;
  const groups=[...doc.querySelectorAll('ui-accordion')],outer=groups[0],nested=groups[1],outerItem=outer.firstElementChild,innerItem=nested.firstElementChild,form=doc.querySelector('form'),editor=doc.querySelector('ui-form'),field=form.elements.observation,context=form.elements.context;
  check(groups.every(node=>node.hasAttribute('data-ui-ready')),'Nested groups initialize independently.');const innerSummary=innerItem.firstElementChild;innerSummary.focus();key(innerSummary,'End');check(doc.activeElement===nested.lastElementChild.firstElementChild,'Nested keys stay with their group.');
  innerItem.open=true;context.focus();check(!key(context,'ArrowDown') && doc.activeElement===context,'Content editing keys stay native.');outerItem.open=false;await settle();check(doc.activeElement===outerItem.firstElementChild,'Outer collapse recovers nested content focus.');
  form.requestSubmit();const summary=editor.querySelector('ui-error-summary');check(!summary.hidden && doc.activeElement===summary && !outerItem.open,'Validation owns summary focus.');summary.querySelector('a').click();await settle();check(outerItem.open && doc.activeElement===field && field.getAttribute('aria-describedby').includes('observation-hint'),'Error links reveal fields and retain hints.');
  field.value='Tide pool';context.value='Low tide';outerItem.open=false;check(new win.FormData(form).get('observation')==='Tide pool' && new win.FormData(form).get('context')==='Low tide' && new win.FormData(form).get('reference')==='COAST-01','Closed content preserves native serialization.');form.reset();await settle();check(field.value==='' && !outerItem.open && summary.hidden,'Reset clears answers/errors, not expansion.');
  context.id='deep-context';win.location.hash='deep-context';await settle();check(outerItem.open && innerItem.open,'Deep fragments reveal nested ancestors.');win.UI.destroy(outer);check(groups.every(node=>!node.hasAttribute('data-ui-ready')),'Parent destroy releases nested groups.');
  const host=doc.createElement('details');host.innerHTML='<summary>Native outer</summary>';outer.before(host);host.append(outer);win.UI.enhance(outer);await settle();check(host.open && outerItem.open && innerItem.open,'Fragment reveal includes native unenhanced ancestors.');
  // Pending fragment work must not survive ownership or navigation changes.
  win=await load('../docs/previews/accordion-0.html');doc=win.document;group=doc.querySelector('ui-accordion');
  const target=doc.querySelector('#equipment'), nativeScroll=target.scrollIntoView;let scrolls=0;
  target.scrollIntoView=()=>{scrolls++;};
  win.history.replaceState(null,'','#equipment');win.dispatchEvent(new win.HashChangeEvent('hashchange'));win.UI.destroy(group);await settle();check(scrolls===0,'Destroy cancels queued fragment scrolling.');
  win.UI.enhance(group);doc.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));await settle();check(scrolls===0,'Intervening user key cancels queued scrolling.');
  win.dispatchEvent(new win.HashChangeEvent('hashchange'));win.history.replaceState(null,'','#missing');await settle();check(scrolls===0,'Superseding hash prevents stale scroll writes.');
  const duplicate=doc.createElement('p');duplicate.id='equipment';doc.querySelector('main').append(duplicate);win.history.replaceState(null,'','#equipment');group.children[1].open=false;win.dispatchEvent(new win.HashChangeEvent('hashchange'));await settle();check(!group.children[1].open && scrolls===0,'Duplicate fragment IDs are left to native navigation.');duplicate.remove();
  target.hidden=true;win.dispatchEvent(new win.HashChangeEvent('hashchange'));await settle();check(!group.children[1].open && target.hidden,'Authored hiding is not removed for fragments.');target.hidden=false;
  for(const hash of ['#%E0%A4%A','#missing']) {win.history.replaceState(null,'',hash);win.dispatchEvent(new win.HashChangeEvent('hashchange'));await settle();check(scrolls===0,'Malformed, text or missing fragments are ignored: '+hash+' / visible hash '+win.location.hash+' / scrolls '+scrolls);}
  win.history.replaceState(null,'','#equipment:~:text=Bring');win.dispatchEvent(new win.HashChangeEvent('hashchange'));await settle();check(win.location.hash.includes(':~:') ? scrolls===0 : scrolls===1,'Text directives are ignored when exposed; stripped directives leave an ordinary ID fragment.');
  target.scrollIntoView=nativeScroll;
  // A disclosure wrapper inside a modal must not steal its parent's native close ownership.
  win=await load('../docs/previews/enhancement-1.html');doc=win.document;
  const dialog=doc.querySelector('dialog'), close=dialog.querySelector('button'), wrapper=doc.createElement('ui-accordion');wrapper.innerHTML='<details open><summary>Task actions</summary></details>';close.before(wrapper);wrapper.firstElementChild.append(close);win.UI.enhance(dialog);
  doc.querySelector('#enhance-open').click();await settle();close.click();await settle();check(!dialog.open && wrapper.hasAttribute('data-ui-ready'),'Accordion content keeps parent dialog close ownership.');
  win=await load('../docs/previews/accordion-0.html#equipment');doc=win.document;await settle();check(doc.querySelectorAll('details')[1].open,'Initial URL fragment is revealed during bootstrap.');
  for(const setup of ['window.MutationObserver=undefined;','window.AbortController=undefined;','window.requestAnimationFrame=undefined;']) {win=await load('../docs/previews/accordion-0.html',false,setup);doc=win.document;check(!doc.querySelector('ui-accordion').hasAttribute('data-ui-ready') && doc.querySelector('details').open,'Missing enhancement capability preserves native baseline.');}
  win=await load('../docs/previews/accordion-0.html',false,`document.addEventListener('DOMContentLoaded',()=>UI.destroy(document),{once:true});`);doc=win.document;group=doc.querySelector('ui-accordion');
  check(!group.hasAttribute('data-ui-ready'),'Destroy before automatic setup stops a marker-free group.');win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready'),'Explicit enhance resumes a stopped marker-free group.');
  frame.style.inlineSize='320px';
  for(const nojs of [false,true]) {
    win=await load('../docs/previews/accordion-0.html',nojs);doc=win.document;
    for(const brand of ['', 'forest']) for(const theme of ['light','dark']) for(const dir of ['ltr','rtl']) {
      doc.documentElement.dataset.brand=brand;doc.documentElement.dataset.theme=theme;doc.documentElement.dir=dir;doc.documentElement.style.fontSize='200%';doc.body.style.cssText='line-height:1.5;letter-spacing:.12em;word-spacing:.16em';for(const item of doc.querySelectorAll('details'))item.open=true;await settle();
      check(doc.documentElement.scrollWidth<=doc.documentElement.clientWidth+1 && (nojs ? !doc.querySelector('ui-accordion').hasAttribute('data-ui-ready') : doc.querySelector('ui-accordion').hasAttribute('data-ui-ready')),(nojs?'No script':'Enhanced')+'/'+(brand||'default')+'/'+theme+'/'+dir+': enlarged 320px reflow.');
    }
  }frame.style.inlineSize='100%';return passed;
}
document.addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('#run'),frame=document.querySelector('#accordion-frame');if(!button||!frame)return;
  const load=async(route,nojs=false,setup='')=>{
    if(nojs)frame.setAttribute('sandbox','allow-same-origin');else frame.removeAttribute('sandbox');
    if(setup){const html=await(await fetch(route)).text();await new Promise(resolve=>{frame.onload=resolve;frame.srcdoc=html.replace('<head>',`<head><base href="${new URL(route,location.href).href}"><script>${setup}<\/script>`);});}
    else await new Promise(resolve=>{frame.onload=resolve;const url=new URL(route,location.href);url.searchParams.set('ui-test',Date.now());frame.src=url.href;frame.removeAttribute('srcdoc');});return frame.contentWindow;
  };
  button.addEventListener('click',async()=>{button.disabled=true;document.querySelector('#assertions').replaceChildren();try{const passed=await runAccordionChecks(load,frame);document.querySelector('#results').textContent='PASS: '+passed.length+' Accordion checks. '+frame.contentWindow.navigator.userAgent;for(const message of passed){const item=document.createElement('li');item.textContent=message;document.querySelector('#assertions').append(item);}}catch(error){document.querySelector('#results').textContent='FAIL: '+error.message;}finally{button.disabled=false;frame.style.inlineSize='100%';document.querySelector('#results-title').focus();}});
});
