"use strict";

let chatWindow;
let chatInput;
let sendButton;
let ToggleMenuButton;
const keywordMap = {};
const chatFlow = {};
const chatAvatarPath = document
  .getElementById("chat-avatar")
  .getAttribute("src");
const isArabic = document.documentElement.lang === "ar";
const initializeProjectsFlow = () => {
  const _0x39a4c8 = document.getElementById("flow-projects");
  if (!_0x39a4c8) {
    return;
  }
  const _0xb3997a = "projects";
  const _0x3730f9 = Array.from(_0x39a4c8.querySelectorAll(".project-item")).map(
    (_0x1f7dd4) => {
      const _0x2f6b85 = _0x1f7dd4.getAttribute("data-media");
      const _0x4c555d = {
        title: _0x1f7dd4.getAttribute("data-title"),
        summary: _0x1f7dd4.querySelector(".summary").innerHTML.trim(),
        link: _0x1f7dd4.getAttribute("data-link"),
        image: _0x1f7dd4.getAttribute("data-image"),
        mediaType: _0x2f6b85,
      };
      if (_0x2f6b85 === "gallery") {
        _0x4c555d.gallery = Array.from(
          _0x1f7dd4.querySelectorAll(".gallery-urls img"),
        ).map((_0x5416bb) => _0x5416bb.getAttribute("src"));
      } else if (_0x2f6b85 === "youtube") {
        _0x4c555d.youtubeId = _0x1f7dd4.getAttribute("data-youtube-id");
      } else if (_0x2f6b85 === "video") {
        _0x4c555d.videoUrl = _0x1f7dd4.getAttribute("data-video-url");
      }
      return _0x4c555d;
    },
  );
  chatFlow[_0xb3997a] = [
    {
      speaker: "A",
      text: _0x39a4c8.querySelector(".intro").innerHTML.trim(),
      type: "projects-sequence",
      data: _0x3730f9,
      globalButtons: Array.from(
        _0x39a4c8.querySelectorAll(".project-buttons .global li"),
      ).map((_0x4f37d8) => ({
        text: _0x4f37d8.innerText,
        action: _0x4f37d8.getAttribute("data-action"),
        styleClass: _0x4f37d8.getAttribute("data-class") || "",
      })),
      finalButtons: Array.from(
        _0x39a4c8.querySelectorAll(".project-buttons .final li"),
      ).map((_0x1a2634) => ({
        text: _0x1a2634.innerText,
        action: _0x1a2634.getAttribute("data-action"),
        styleClass: _0x1a2634.getAttribute("data-class") || "",
      })),
    },
  ];
  const _0x27c807 = _0x39a4c8
    .getAttribute("data-triggers")
    .split(",")
    .map((_0x2287a8) => _0x2287a8.trim().toLowerCase());
  _0x27c807.forEach((_0x3d6dc7) => {
    keywordMap[_0x3d6dc7] = _0xb3997a;
  });
};
let currentProjectIndex = 0;
let projectsSequenceData = [];
let sequenceGlobalButtons = [];
let sequenceFinalButtons = [];
const startProjectsSequence = async (_0x592c1d, _0x2f484c, _0x3f429d) => {
  projectsSequenceData = _0x592c1d;
  sequenceGlobalButtons = _0x2f484c;
  sequenceFinalButtons = _0x3f429d;
  currentProjectIndex = 0;
  await displayNextProject();
};
const displayNextProject = async () => {
  const _0x2b3f93 = projectsSequenceData[currentProjectIndex];
  if (!_0x2b3f93) {
    return;
  }
  const _0x45ea36 = projectsSequenceData.length;
  const _0x2a34c1 = isArabic
    ? "المشروع " +
      (currentProjectIndex + 1) +
      " من " +
      _0x45ea36 +
      " : **" +
      _0x2b3f93.title +
      "**"
    : "Project " +
      (currentProjectIndex + 1) +
      " of " +
      _0x45ea36 +
      " : **" +
      _0x2b3f93.title +
      "**";
  const _0x30bda4 = isArabic ? "المشروع التالي" : "Show Next Project";
  const _0x194116 = currentProjectIndex === _0x45ea36 - 1;
  const _0xfa5d29 = _0x194116
    ? []
    : [
        {
          text: _0x30bda4,
          action: "__project_flow" + (currentProjectIndex + 1),
        },
      ];
  const _0xfe1360 = _0x194116 ? sequenceFinalButtons : sequenceGlobalButtons;
  const _0x2abee1 = "temp_proj_" + Date.now();
  chatFlow[_0x2abee1] = [
    {
      speaker: "A",
      text: _0x2a34c1,
      delay: 300,
    },
    {
      speaker: "A",
      isRich: true,
      type: "single-project-card",
      projectData: _0x2b3f93,
      options: [..._0xfa5d29, ..._0xfe1360],
      delay: 200,
    },
  ];
  await startConversationFlow(_0x2abee1);
};
const initializeClientsFlow = () => {
  const _0x329411 = document.getElementById("flow-clients");
  if (!_0x329411) {
    return;
  }
  const _0x23575a = Array.from(_0x329411.querySelectorAll(".client-item")).map(
    (_0xa68ed2) => ({
      name: _0xa68ed2.getAttribute("data-name"),
      logoUrl: _0xa68ed2.getAttribute("data-logo"),
    }),
  );
  chatFlow.clients = [
    {
      speaker: "A",
      text: _0x329411.querySelector(".intro")?.innerHTML.trim() || "",
      type: "client-logos",
      logos: _0x23575a,
      options: Array.from(_0x329411.querySelectorAll(".options li")).map(
        (_0x26e1cc) => ({
          text: _0x26e1cc.innerText,
          action: _0x26e1cc.getAttribute("data-action"),
          link: _0x26e1cc.getAttribute("data-link"),
          styleClass: _0x26e1cc.getAttribute("data-class") || "",
        }),
      ),
    },
  ];
  const _0x3946ca = _0x329411
    .getAttribute("data-triggers")
    .split(",")
    .map((_0x334932) => _0x334932.trim().toLowerCase());
  _0x3946ca.forEach((_0x2f0aad) => {
    keywordMap[_0x2f0aad] = "clients";
  });
};
const initializeContactFlow = () => {
  const _0x35cc9c = document.getElementById("flow-contact");
  if (!_0x35cc9c) {
    return;
  }
  const _0x4f1744 = Array.from(
    _0x35cc9c.querySelectorAll(".direct-contact .contact-row"),
  ).map((_0x2f29e8) => ({
    label: _0x2f29e8.getAttribute("data-label"),
    icon: _0x2f29e8.getAttribute("data-icon"),
    value: _0x2f29e8.innerText.trim(),
  }));
  const _0x25764a = Array.from(
    _0x35cc9c.querySelectorAll(".social-links .social-item"),
  ).map((_0x292df4) => ({
    icon: _0x292df4.getAttribute("data-icon"),
    url: _0x292df4.getAttribute("data-url"),
    class: _0x292df4.getAttribute("data-class"),
  }));
  chatFlow.contact = [
    {
      speaker: "A",
      text: _0x35cc9c.querySelector(".intro")?.innerHTML.trim() || "",
      type: "contact-details",
      direct: _0x4f1744,
      socials: _0x25764a,
      options: Array.from(_0x35cc9c.querySelectorAll(".options li")).map(
        (_0x3d1384) => ({
          text: _0x3d1384.innerText,
          action: _0x3d1384.getAttribute("data-action"),
          styleClass: _0x3d1384.getAttribute("data-class") || "",
        }),
      ),
    },
  ];
  const _0x373e97 = _0x35cc9c
    .getAttribute("data-triggers")
    .split(",")
    .map((_0x8cde95) => _0x8cde95.trim().toLowerCase());
  _0x373e97.forEach((_0x228318) => {
    keywordMap[_0x228318] = "contact";
  });
};
const initializeGenericFlows = () => {
  const _0xde70ef = document.querySelectorAll(
    ".generic-flow, #flow-msg-success",
  );
  _0xde70ef.forEach((_0x462600) => {
    const _0x3f27a4 =
      _0x462600.getAttribute("data-flow-id") ||
      _0x462600.id.replace("flow-", "");
    const _0xff2d95 = Array.from(_0x462600.children)
      .filter((_0x104d3e) => !_0x104d3e.classList.contains("options"))
      .map((_0x4c8db8) => {
        const _0x427350 = {
          tag: _0x4c8db8.tagName,
          className: _0x4c8db8.className,
        };
        if (_0x4c8db8.tagName === "UL") {
          _0x427350.items = Array.from(_0x4c8db8.querySelectorAll("li")).map(
            (_0x366f6f) => _0x366f6f.innerHTML.trim(),
          );
        } else {
          _0x427350.content = _0x4c8db8.innerHTML.trim();
        }
        return _0x427350;
      });
    const _0x41d4fe = Array.from(_0x462600.querySelectorAll(".options li")).map(
      (_0x2d6b37) => ({
        text: _0x2d6b37.innerText.trim(),
        action: _0x2d6b37.getAttribute("data-action"),
        link: _0x2d6b37.getAttribute("data-link"),
        styleClass: _0x2d6b37.getAttribute("data-class") || "",
      }),
    );
    chatFlow[_0x3f27a4] = [
      {
        speaker: "A",
        type: "flexible-content",
        blocks: _0xff2d95,
        options: _0x41d4fe,
      },
    ];
    const _0x23666a = _0x462600.getAttribute("data-triggers");
    if (_0x23666a) {
      _0x23666a
        .split(",")
        .map((_0x4222c4) => _0x4222c4.trim().toLowerCase())
        .forEach((_0x103dc3) => {
          keywordMap[_0x103dc3] = _0x3f27a4;
        });
    }
  });
};
function initializeFlows() {
  initializeClientsFlow();
  initializeContactFlow();
  initializeGenericFlows();
  initializeProjectsFlow();
}
const startConversationFlow = async (_0x2b6108) => {
  if (!_0x2b6108 || _0x2b6108 === "__handled") {
    return;
  }
  if (!chatInput) {
    chatInput.disabled = false;
  }
  if (!ToggleMenuButton) {
    ToggleMenuButton = document.getElementById("btn-menu-toggle");
  }
  const _0x3405ff = chatFlow[_0x2b6108];
  let _0x5eb94b = true;
  if (!_0x3405ff) {
    return;
  }
  const _0x5baf52 = document.querySelectorAll(".btn-primary-nav");
  const _0x3f3a4f = document.getElementById("input-nav-wrapper");
  if (_0x3f3a4f) {
    _0x3f3a4f.classList.add("disabled");
  }
  _0x5baf52.forEach((_0x35e273) => _0x35e273.classList.add("disabled"));
  if (chatInput) {
    chatInput.disabled = true;
  }
  if (sendButton) {
    sendButton.disabled = true;
  }
  if (ToggleMenuButton) {
    ToggleMenuButton.disabled = true;
  }
  for (const _0xd8fd72 of _0x3405ff) {
    let _0x5039c7 = _0xd8fd72.text || "";
    await new Promise(async (_0x30cc25) => {
      if (_0xd8fd72.speaker === "A") {
        await new Promise((_0x518a63) =>
          setTimeout(_0x518a63, _0xd8fd72.delay || 500),
        );
        const _0xa32739 = showTypingIndicator(_0x5eb94b);
        await new Promise((_0x8fe178) => setTimeout(_0x8fe178, 1100));
        await hideTypingIndicator(_0xa32739);
        const _0x5d4d95 = createMessageElement(_0xd8fd72, _0x5eb94b);
        _0x5eb94b = false;
        const _0x2ce2c2 = _0x5d4d95.querySelector(".message-bubble");
        _0x2ce2c2.style.opacity = "0";
        _0x2ce2c2.style.transition = "all 0.3s ease-out";
        chatWindow.appendChild(_0x5d4d95);
        const _0x1f0d36 = _0x5d4d95.querySelector("i, .chat-avatar");
        if (_0x1f0d36) {
          if (_0x1f0d36.tagName === "IMG") {
            await new Promise((_0x14154c) => {
              if (_0x1f0d36.complete) {
                _0x14154c();
              } else {
                _0x1f0d36.onload = _0x14154c;
              }
            });
          } else {
            await new Promise((_0x28dfb3) => setTimeout(_0x28dfb3, 30));
          }
        }
        requestAnimationFrame(() => {
          _0x2ce2c2.style.opacity = "1";
        });
        if (_0xd8fd72.type === "projects-sequence") {
          if (_0xd8fd72.text) {
            await typeWriterEffect(_0x2ce2c2, _0xd8fd72.text);
          }
          await startProjectsSequence(
            _0xd8fd72.data,
            _0xd8fd72.globalButtons,
            _0xd8fd72.finalButtons,
          );
        } else if (_0xd8fd72.type === "contact-details") {
          await typeWriterEffect(_0x2ce2c2, _0xd8fd72.text);
          await typeContactSocials(_0x2ce2c2, _0xd8fd72);
        } else if (_0xd8fd72.type === "flexible-content") {
          _0x2ce2c2.classList.add("rich-paragraph");
          for (const _0x347aa6 of _0xd8fd72.blocks) {
            const _0x29644f = document.createElement(
              _0x347aa6.tag.toLowerCase(),
            );
            if (_0x347aa6.className) {
              _0x29644f.className = _0x347aa6.className;
            }
            _0x2ce2c2.appendChild(_0x29644f);
            if (_0x347aa6.tag === "UL") {
              for (const _0x56a95d of _0x347aa6.items) {
                const _0x5f2d50 = document.createElement("li");
                _0x29644f.appendChild(_0x5f2d50);
                await typeWriterEffect(_0x5f2d50, _0x56a95d);
                await new Promise((_0x4dc15d) => setTimeout(_0x4dc15d, 200));
              }
            } else {
              await typeWriterEffect(_0x29644f, _0x347aa6.content);
            }
            await new Promise((_0x24035b) => setTimeout(_0x24035b, 200));
          }
        } else if (!_0xd8fd72.isRich) {
          await typeWriterEffect(_0x2ce2c2, _0x5039c7);
        }
        if (_0xd8fd72.options || _0xd8fd72.contextualOptions) {
          const _0x541949 =
            (_0xd8fd72.isRich &&
              (_0xd8fd72.project?.type === "client-logos" ||
                _0xd8fd72.project?.type === "single-project-card")) ||
            _0xd8fd72.type === "client-logos" ||
            _0xd8fd72.type === "contact-details";
          if (!_0x541949) {
            renderOptions(
              _0xd8fd72.options || _0xd8fd72.contextualOptions,
              _0x5d4d95,
              false,
            );
          }
        }
      } else {
        chatWindow.appendChild(createMessageElement(_0xd8fd72));
      }
      scrollToBottom();
      _0x30cc25();
    });
  }
  _0x3f3a4f.classList.remove("disabled");
  _0x5baf52.forEach((_0x24d8a6) => _0x24d8a6.classList.remove("disabled"));
  if (chatInput) {
    chatInput.disabled = false;
    if (window.innerWidth > 1024) {
      chatInput.focus();
    }
  }
  if (ToggleMenuButton) {
    ToggleMenuButton.disabled = false;
  }
};
const showTypingIndicator = (_0x36277a = false) => {
  const _0x1a7cd8 = document.createElement("div");
  _0x1a7cd8.classList.add(
    "message-row",
    "ai-message",
    "typing-indicator-row",
    "fade-out-init",
  );
  let _0x9ced1e = _0x36277a
    ? '<img src="' +
      chatAvatarPath +
      '" class="chat-avatar" id="active-avatar">'
    : "";
  _0x1a7cd8.innerHTML =
    "\n        " +
    _0x9ced1e +
    '\n        <div class="message-bubble typing-indicator">\n            <span></span><span></span><span></span>\n        </div>';
  chatWindow.appendChild(_0x1a7cd8);
  requestAnimationFrame(() => _0x1a7cd8.classList.add("visible"));
  scrollToBottom();
  return _0x1a7cd8;
};
const hideTypingIndicator = (_0x2025a9) => {
  return new Promise((_0x3e04d9) => {
    if (!_0x2025a9) {
      return _0x3e04d9();
    }
    const _0x3189e1 = _0x2025a9.querySelector(".typing-indicator");
    if (_0x3189e1) {
      _0x3189e1.style.opacity = "0";
      _0x3189e1.style.transition = "opacity 0.3s ease";
    }
    setTimeout(() => {
      _0x2025a9.remove();
      _0x3e04d9();
    }, 300);
  });
};
const typeContactSocials = async (_0x3480f2, _0x4e23a6) => {
  const _0x359049 = document.createElement("div");
  _0x359049.className = "contact-section-wrapper";
  _0x3480f2.appendChild(_0x359049);
  for (const _0x27ddcf of _0x4e23a6.direct) {
    const _0x403e43 = document.createElement("span");
    _0x403e43.className = "contact-direct-row";
    _0x403e43.innerHTML =
      '<span><i class="' +
      _0x27ddcf.icon +
      '"></i><span class="label">' +
      _0x27ddcf.label +
      ' </span></span> <span class="type-target"></span>';
    _0x359049.appendChild(_0x403e43);
    const _0x165f9c = _0x403e43.querySelector(".type-target");
    await typeWriterEffect(_0x165f9c, _0x27ddcf.value);
    await new Promise((_0x25e02e) => setTimeout(_0x25e02e, 200));
    scrollToBottom();
  }
  const _0x2be070 = document.createElement("div");
  _0x2be070.className = "contact-social-row";
  _0x359049.appendChild(_0x2be070);
  for (const _0x39ce27 of _0x4e23a6.socials) {
    const _0x26e8c7 = document.createElement("a");
    _0x26e8c7.className = "contact-social-icon";
    _0x26e8c7.href = _0x39ce27.url;
    _0x26e8c7.target = "_blank";
    _0x26e8c7.innerHTML =
      '<i class="' + _0x39ce27.icon + " " + _0x39ce27.class + '"></i>';
    _0x2be070.appendChild(_0x26e8c7);
    await new Promise((_0x38acac) => setTimeout(_0x38acac, 150));
    _0x26e8c7.classList.add("visible");
    scrollToBottom();
  }
  if (_0x4e23a6.options) {
    const _0x266ff7 = _0x3480f2.closest(".message-row");
    renderOptions(_0x4e23a6.options, _0x266ff7, false);
    scrollToBottom();
  }
};
const toggleSendButtonState = () => {
  sendButton.disabled = chatInput.value.trim() === "";
};
const processCommand = (_0x55e73f) => {
  const _0x2daaa2 = _0x55e73f.trim().toLowerCase();
  if (_0x2daaa2.startsWith("__project_flow")) {
    const _0x529492 = parseInt(_0x2daaa2.replace("__project_flow", ""));
    if (!isNaN(_0x529492)) {
      currentProjectIndex = _0x529492;
      displayNextProject();
      return "__handled";
    }
  }
  if (_0x2daaa2 === "__next_project") {
    currentProjectIndex++;
    displayNextProject();
    return "__handled";
  }
  if (keywordMap[_0x2daaa2]) {
    return keywordMap[_0x2daaa2];
  }
  if (chatFlow[_0x2daaa2]) {
    return _0x2daaa2;
  }
  let _0x4c46bd = null;
  let _0x5b9d97 = 99;
  const _0x188cfb = 2;
  const _0x297be9 = Object.keys(keywordMap);
  for (const _0x28b80e of _0x297be9) {
    const _0xa890e6 = levenshtein(_0x2daaa2, _0x28b80e);
    if (_0xa890e6 <= _0x188cfb && _0xa890e6 < _0x5b9d97) {
      _0x5b9d97 = _0xa890e6;
      _0x4c46bd = keywordMap[_0x28b80e];
    }
    if (_0x2daaa2.includes(_0x28b80e) && _0x28b80e.length > 3) {
      return keywordMap[_0x28b80e];
    }
  }
  return _0x4c46bd || "error";
};
const generateAndProcessResponse = async (_0x487997, _0x4ba690 = _0x487997) => {
  const _0x4624a3 = document.getElementById("intro-screen");
  if (_0x4624a3 && !_0x4624a3.classList.contains("fade-out")) {
    _0x4624a3.classList.add("fade-out");
    setTimeout(() => _0x4624a3.remove(), 600);
  }
  if (_0x487997 === "open_contact_form") {
    window.openContactModal();
    return;
  }
  if (!_0x487997.trim()) {
    return;
  }
  const _0x5cf9e3 = chatWindow.querySelectorAll(".contextual-options");
  if (_0x5cf9e3.length > 0) {
    _0x5cf9e3[_0x5cf9e3.length - 1].remove();
  }
  const _0x4997de = processCommand(_0x487997);
  chatInput.value = "";
  toggleSendButtonState();
  const _0x49db02 = {
    speaker: "U",
    text: _0x4ba690,
    delay: 0,
  };
  const _0x1ec376 = createMessageElement(_0x49db02);
  chatWindow.appendChild(_0x1ec376);
  scrollToBottom();
  await startConversationFlow(_0x4997de);
};
const renderOptions = (_0x2f111c, _0x44f426, _0x55d2ff = false) => {
  if (!_0x2f111c || _0x2f111c.length === 0) {
    return;
  }
  const _0x189c12 = document.createElement("div");
  _0x189c12.classList.add("contextual-options");
  _0x2f111c.forEach((_0x56be94, _0x103338) => {
    const _0x22215b = _0x56be94.action
      ? document.createElement("button")
      : document.createElement("a");
    _0x22215b.classList.add("btn", "btn-primary");
    if (_0x56be94.styleClass) {
      _0x22215b.classList.add(_0x56be94.styleClass);
    }
    _0x22215b.innerHTML =
      '<span class="button-content"><span>' +
      _0x56be94.text +
      '</span><span aria-hidden="true">' +
      _0x56be94.text +
      "</span></span>";
    const _0x32734b = _0x103338 * 100;
    _0x22215b.style.animation = "fadeUpAndIn 0.3s ease-out forwards";
    _0x22215b.style.animationDelay = _0x32734b + "ms";
    if (_0x56be94.action) {
      _0x22215b.setAttribute("data-action", _0x56be94.action);
      _0x22215b.addEventListener("click", () => {
        generateAndProcessResponse(_0x56be94.action, _0x56be94.text);
      });
    } else if (_0x56be94.link) {
      _0x22215b.href = _0x56be94.link;
      _0x22215b.target = "_blank";
    }
    _0x189c12.appendChild(_0x22215b);
  });
  if (_0x55d2ff) {
    _0x44f426.appendChild(_0x189c12);
  } else if (document.body.contains(_0x44f426)) {
    _0x44f426.insertAdjacentElement("afterend", _0x189c12);
  } else {
    document.getElementById("chat-window").appendChild(_0x189c12);
  }
};
const typeWriterEffect = (_0x2405b0, _0x19a05c) => {
  return new Promise((_0x123e26) => {
    let _0x4decf7;
    const _0x416209 = new Typewriter(_0x2405b0, {
      delay: 15,
      loop: false,
      cursor: " ",
      autoStart: true,
      stringSplitter: (_0x2bd2a2) => {
        scrollToBottom();
        const _0x1bca55 =
          /(<[^>]+>|[\u{1F1E6}-\u{1F1FF}]{2}|[\p{Extended_Pictographic}]|.)/gu;
        return _0x2bd2a2.match(_0x1bca55) || [];
      },
    });
    const _0xc8984b = _0x19a05c.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>",
    );
    _0x416209.typeString(_0xc8984b);
    _0x416209
      .callFunction(() => {
        if (_0x4decf7) {
          clearInterval(_0x4decf7);
        }
        const _0x4d19df = _0x2405b0.querySelector(".Typewriter__cursor");
        if (_0x4d19df) {
          _0x4d19df.style.display = "none";
        }
        _0x416209.stop();
        scrollToBottom();
        _0x123e26();
      })
      .start();
    _0x4decf7 = setInterval(scrollToBottom, 50);
    setTimeout(
      () => {
        if (_0x4decf7) {
          clearInterval(_0x4decf7);
        }
      },
      _0x19a05c.length * 30 + 1000,
    );
  });
};
const createMessageElement = (_0x558897, _0x1272d0 = false) => {
  const _0xdd22a = document.createElement("div");
  _0xdd22a.classList.add(
    "message-row",
    _0x558897.speaker === "A" ? "ai-message" : "user-message",
  );
  if (_0x558897.speaker === "A" && _0x1272d0) {
    const _0x7a131d = document.createElement("img");
    _0x7a131d.src = chatAvatarPath;
    _0x7a131d.className = "chat-avatar";
    _0xdd22a.appendChild(_0x7a131d);
  } else if (_0x558897.speaker === "A") {
    _0xdd22a.classList.add("no-avatar");
  }
  if (_0x558897.rowClass) {
    _0xdd22a.classList.add(_0x558897.rowClass);
  }
  const _0x2427b7 = document.createElement("div");
  _0x2427b7.classList.add("message-bubble");
  if (_0x558897.isRich && _0x558897.type === "single-project-card") {
    _0x2427b7.classList.add("single-project-card", "project-fade-in");
    const _0x38f818 = _0x558897.projectData;
    if (!_0x38f818) {
      return _0xdd22a;
    }
    const _0x3cd3ab = document.createElement("div");
    _0x3cd3ab.className = "project-card";
    const _0x10d139 =
      _0x38f818.mediaType === "image"
        ? "project-media-wrapper project-image"
        : "project-media-wrapper popup-content";
    let _0x14c6d4 = "";
    if (_0x38f818.mediaType === "gallery") {
      _0x14c6d4 = "fa-solid fa-photo-film";
    } else if (
      _0x38f818.mediaType === "youtube" ||
      _0x38f818.mediaType === "video"
    ) {
      _0x14c6d4 = "fa-solid fa-play";
    }
    const _0x4c2307 = _0x14c6d4
      ? '<div class="media-icon-overlay"><i class="' +
        _0x14c6d4 +
        '"></i></div>'
      : "";
    _0x3cd3ab.innerHTML =
      '\n        <div class="' +
      _0x10d139 +
      '">\n            ' +
      _0x4c2307 +
      '\n            <img src="' +
      _0x38f818.image +
      '" alt="' +
      _0x38f818.title +
      '">\n        </div>\n        <div class="details">\n            <h4>' +
      _0x38f818.title +
      "</h4>\n            <p>" +
      _0x38f818.summary +
      "</p>\n            " +
      (_0x38f818.link
        ? '\n            <a href="' +
          _0x38f818.link +
          '" target="_blank" class="preview-link">\n                ' +
          (isArabic ? "معاينة" : "Preview") +
          ' \n                <i class="fa-solid fa-arrow-up-right-from-square"></i>\n            </a>'
        : "") +
      "\n        </div>\n    ";
    if (_0x3cd3ab.querySelector(".popup-content")) {
      _0x3cd3ab.querySelector(".popup-content").onclick = () =>
        openMasterModal(_0x38f818);
    }
    _0x2427b7.appendChild(_0x3cd3ab);
  } else if (_0x558897.type === "client-logos") {
    const _0x2f2b0a = document.createElement("div");
    _0x2f2b0a.className = "client-intro-text";
    _0x2427b7.appendChild(_0x2f2b0a);
    typeWriterEffect(_0x2f2b0a, _0x558897.text).then(() => {
      const _0x159e6f = document.createElement("div");
      _0x159e6f.className = "client-logos-wrapper";
      _0x2427b7.appendChild(_0x159e6f);
      if (_0x558897.logos && _0x558897.logos.length > 0) {
        _0x558897.logos.forEach((_0x44040f, _0x14ee61) => {
          const _0x104783 = document.createElement("div");
          _0x104783.className = "client-logo-item animated-logo";
          _0x104783.style.animationDelay = _0x14ee61 * 100 + "ms";
          _0x104783.innerHTML =
            '<img src="' +
            _0x44040f.logoUrl +
            '" alt="' +
            _0x44040f.name +
            '">';
          _0x159e6f.appendChild(_0x104783);
        });
        const _0x1f16b4 = _0x558897.logos.length * 100 + 100;
        setTimeout(() => {
          if (_0x558897.options) {
            renderOptions(_0x558897.options, _0xdd22a, false);
            scrollToBottom();
          }
        }, _0x1f16b4);
      }
      scrollToBottom();
    });
  } else if (_0x558897.speaker === "U") {
    _0x2427b7.innerHTML = _0x558897.text.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>",
    );
  }
  _0xdd22a.appendChild(_0x2427b7);
  return _0xdd22a;
};
const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
};
function levenshtein(_0x22e819, _0x416a6e) {
  if (_0x22e819.length === 0) {
    return _0x416a6e.length;
  }
  if (_0x416a6e.length === 0) {
    return _0x22e819.length;
  }
  const _0x2da21e = [];
  for (let _0x5bf43e = 0; _0x5bf43e <= _0x416a6e.length; _0x5bf43e++) {
    _0x2da21e[_0x5bf43e] = [_0x5bf43e];
  }
  for (let _0x40e6ff = 0; _0x40e6ff <= _0x22e819.length; _0x40e6ff++) {
    _0x2da21e[0][_0x40e6ff] = _0x40e6ff;
  }
  for (let _0x58c8af = 1; _0x58c8af <= _0x416a6e.length; _0x58c8af++) {
    for (let _0x474ebd = 1; _0x474ebd <= _0x22e819.length; _0x474ebd++) {
      if (_0x416a6e.charAt(_0x58c8af - 1) === _0x22e819.charAt(_0x474ebd - 1)) {
        _0x2da21e[_0x58c8af][_0x474ebd] =
          _0x2da21e[_0x58c8af - 1][_0x474ebd - 1];
      } else {
        _0x2da21e[_0x58c8af][_0x474ebd] = Math.min(
          _0x2da21e[_0x58c8af - 1][_0x474ebd - 1] + 1,
          _0x2da21e[_0x58c8af][_0x474ebd - 1] + 1,
          _0x2da21e[_0x58c8af - 1][_0x474ebd] + 1,
        );
      }
    }
  }
  return _0x2da21e[_0x416a6e.length][_0x22e819.length];
}
const generateProjectMessage = (
  _0x1870a2,
  _0x839493,
  _0x4567b4,
  _0x5ae8a9,
  _0x370cf0,
) => {
  const _0x15bfb8 = _0x1870a2 === _0x4567b4 - 1;
  let _0x318126 = [];
  if (_0x15bfb8) {
    _0x318126 = _0x370cf0 || [];
  } else {
    _0x318126.push({
      text: "Show Next Project",
      action: "__project_flow" + (_0x1870a2 + 1),
    });
    if (_0x5ae8a9) {
      _0x318126.push(..._0x5ae8a9);
    }
  }
  return [
    {
      speaker: "A",
      text:
        "Project " +
        (_0x1870a2 + 1) +
        " of " +
        _0x4567b4 +
        " : **" +
        _0x839493.title +
        "**",
      delay: 500,
    },
    {
      speaker: "A",
      isRich: true,
      project: {
        type: "single-project-card",
        data: _0x839493,
      },
      options: _0x318126,
    },
  ];
};
document.addEventListener("DOMContentLoaded", () => {
  chatWindow = document.getElementById("chat-window");
  chatInput = document.getElementById("chat-input");
  sendButton = document.getElementById("send-button");
  const _0x3d0ca4 = document.getElementById("body");
  const _0x164713 = document.getElementById("primary-nav");
  const _0x585ac3 = [];
  document
    .getElementById("intro-options-target")
    .querySelectorAll(".btn-primary")
    .forEach((_0x38549c) => {
      const _0x1fdb4d = _0x38549c.querySelector(".button-content");
      if (!_0x1fdb4d) {
        return;
      }
      const _0x41e1b3 = _0x1fdb4d.querySelector("span").innerHTML;
      _0x38549c.innerHTML =
        '\n            <span class="button-content">\n                <span>' +
        _0x41e1b3 +
        '</span>\n                <span aria-hidden="true">' +
        _0x41e1b3 +
        "</span>\n            </span>\n        ";
    });
  const _0x42441b = document.getElementById("checkbox");
  _0x42441b.addEventListener("change", () => {
    document.body.classList.add("no-transition");
    document.body.classList.toggle("dark");
    document.body.offsetHeight;
    document.body.classList.remove("no-transition");
  });
  const _0x46eafa = () => {
    const _0x142060 = document.getElementById("intro-options-target");
    if (!_0x142060) {
      return;
    }
    const _0x48ba35 = _0x142060.querySelectorAll("button");
    _0x48ba35.forEach((_0x4d4b14) => {
      _0x4d4b14.onclick = () => {
        const _0x1fa696 = _0x4d4b14.getAttribute("data-action");
        const _0x1604ea = _0x4d4b14.querySelector(
          ".button-content span",
        ).innerText;
        generateAndProcessResponse(_0x1fa696, _0x1604ea);
      };
    });
  };
  window.openContactModal = () => {
    const _0x376277 = document.getElementById("master-modal");
    const _0x323a44 = document.getElementById("modal-content-area");
    _0x323a44.innerHTML =
      '\n        <div class="contact-form-wrapper">\n            <h3>' +
      (isArabic
        ? "يسعدني تلقي رسالتك في أي وقت"
        : "Feel free to drop me a message") +
      '</h3>\n            <form class="ajax-contact-form" id="ajax-contact-form">\n                <input autocomplete="off" type="text" name="user_name" \n                    placeholder="' +
      (isArabic ? "الاسم" : "Name") +
      '" required>\n                <input autocomplete="off" type="email" name="user_email" id="form_email" \n                    placeholder="' +
      (isArabic ? "البريد الإلكتروني" : "Email") +
      '" required> \n                <textarea name="user_message" \n                    placeholder="' +
      (isArabic ? "رسالتك..." : "Message") +
      '" required></textarea>\n                <button type="submit" id="form-submit-btn" class="btn btn-primary">\n                    <span class="button-content">\n                        <span>' +
      (isArabic ? "إرسال الرسالة" : "Send Message") +
      '</span>\n                        <span aria-hidden="true">' +
      (isArabic ? "إرسال الرسالة" : "Send Message") +
      "</span>\n                    </span>\n                </button>\n            </form>\n        </div>\n        ";
    _0x376277.classList.add("active", "modal-contact");
    const _0x1d3b2b = document.getElementById("ajax-contact-form");
    _0x1d3b2b.onsubmit = async function (_0x739ee5) {
      _0x739ee5.preventDefault();
      const _0x98b0c2 = document.getElementById("form-submit-btn");
      const _0x203cff = this.querySelector('[name="user_name"]').value;
      const _0x4fd80e = this.querySelector('[name="user_email"]').value;
      const _0x32741f = this.querySelector('[name="user_message"]').value;
      _0x98b0c2.disabled = true;
      _0x98b0c2.innerText = isArabic ? "جاري الإرسال..." : "Sending...";
      const _0x40abce = new FormData();
      _0x40abce.append("user_name", _0x203cff);
      _0x40abce.append("user_email", _0x4fd80e);
      _0x40abce.append("user_message", _0x32741f);
      try {
        const _0x156635 = await fetch("contact.php", {
          method: "POST",
          body: _0x40abce,
        });
        const _0x23bb7e = await _0x156635.json();
        if (_0x23bb7e.status === "success") {
          closeMasterModal();
          setTimeout(() => {
            startConversationFlow("msg_success");
          }, 500);
        } else {
          throw new Error(_0x23bb7e.message);
        }
      } catch (_0x2f897e) {
        console.error("Submission Error:", _0x2f897e);
        _0x98b0c2.innerText = isArabic
          ? "خطأ - حاول مرة أخرى"
          : "Error - Try Again";
        _0x98b0c2.disabled = false;
      }
    };
  };
  window.openMasterModal = (_0xfacbc6) => {
    const _0x30789f = document.getElementById("master-modal");
    const _0x1f5f43 = document.getElementById("modal-content-area");
    window.currentSlideIndex = 0;
    _0x1f5f43.innerHTML = "";
    if (_0xfacbc6.mediaType === "gallery") {
      let _0x3946cc = _0xfacbc6.gallery
        .map(
          (_0x5649d0) =>
            '<div class="slider-item"><img alt="" src="' +
            _0x5649d0 +
            '" class="slider-img"></div>',
        )
        .join("");
      _0x1f5f43.innerHTML =
        '\n                <div class="modal-slider">\n                    <div id="modal-counter" class="modal-counter"></div> \n                    <button class="slider-nav prev-slide" onclick="moveSlide(-1)"><i class="fa-solid fa-chevron-left"></i></button>\n                    <div class="slider-track" id="s-track">' +
        _0x3946cc +
        '</div>\n                    <button class="slider-nav next-slide" onclick="moveSlide(1)"><i class="fa-solid fa-chevron-right"></i></button>\n                </div>';
      _0x3454e9(_0xfacbc6.gallery.length);
      _0x18674f(_0xfacbc6.gallery.length);
    } else if (_0xfacbc6.mediaType === "video") {
      _0x1f5f43.innerHTML =
        '<video src="' +
        _0xfacbc6.videoUrl +
        '" controls autoplay style="width:100%"></video>';
    } else if (_0xfacbc6.mediaType === "youtube") {
      _0x1f5f43.innerHTML =
        '\n                <iframe width="100%" height="100%" \n                    src="https://www.youtube-nocookie.com/embed/' +
        _0xfacbc6.youtubeId +
        '?autoplay=1&rel=0&enablejsapi=1" \n                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" \n                    allowfullscreen>\n                </iframe>';
    }
    _0x30789f.classList.add("active");
  };
  window.currentSlideIndex = 0;
  window.moveSlide = (_0x57054f) => {
    const _0x30b7f5 = document.getElementById("s-track");
    if (!_0x30b7f5) {
      return;
    }
    const _0x1cdde2 = _0x30b7f5.querySelectorAll(".slider-item");
    const _0x22ca4a = _0x1cdde2.length;
    if (_0x22ca4a === 0) {
      return;
    }
    let _0x1812de = window.currentSlideIndex + _0x57054f;
    if (_0x1812de < 0) {
      _0x1812de = 0;
    } else if (_0x1812de >= _0x22ca4a) {
      _0x1812de = _0x22ca4a - 1;
    }
    window.currentSlideIndex = _0x1812de;
    const _0x1bd1c6 = window.currentSlideIndex * 100;
    if (isArabic) {
      _0x30b7f5.style.transform = "translateX(" + _0x1bd1c6 + "%)";
    } else {
      _0x30b7f5.style.transform = "translateX(-" + _0x1bd1c6 + "%)";
    }
    _0x18674f(_0x22ca4a);
    _0x3454e9(_0x22ca4a);
  };
  document.addEventListener("keydown", function (_0x3f06e4) {
    if (_0x3f06e4.key === "Escape") {
      const _0x431eea = document.getElementById("master-modal");
      if (_0x431eea.classList.contains("active")) {
        closeMasterModal();
      }
    }
    if (document.querySelector(".modal-slider")) {
      if (_0x3f06e4.key === "ArrowLeft") {
        window.moveSlide(-1);
      } else if (_0x3f06e4.key === "ArrowRight") {
        window.moveSlide(1);
      }
    }
  });
  function _0x18674f(_0x113da9) {
    const _0x23d2c5 = document.querySelector(".prev-slide");
    const _0x20f780 = document.querySelector(".next-slide");
    if (!_0x23d2c5 || !_0x20f780) {
      return;
    }
    if (isArabic) {
      _0x23d2c5.style.display =
        window.currentSlideIndex === 0 ? "none" : "flex";
      _0x20f780.style.display =
        window.currentSlideIndex === _0x113da9 - 1 ? "none" : "flex";
    } else {
      _0x23d2c5.style.display =
        window.currentSlideIndex === 0 ? "none" : "flex";
      _0x20f780.style.display =
        window.currentSlideIndex === _0x113da9 - 1 ? "none" : "flex";
    }
  }
  let _0xc4343 = 0;
  let _0x5b069b = 0;
  const _0x4a2e1c = document.querySelector(".modal-container");
  _0x4a2e1c.addEventListener(
    "touchstart",
    (_0x485ef5) => {
      _0xc4343 = _0x485ef5.changedTouches[0].screenX;
    },
    {
      passive: true,
    },
  );
  _0x4a2e1c.addEventListener(
    "touchend",
    (_0x3a7d9b) => {
      _0x5b069b = _0x3a7d9b.changedTouches[0].screenX;
      _0x3e446d();
    },
    {
      passive: true,
    },
  );
  function _0x3e446d() {
    const _0x1b89c7 = document.getElementById("s-track");
    if (!_0x1b89c7) {
      return;
    }
    const _0x19e839 = 50;
    if (_0x5b069b < _0xc4343 - _0x19e839) {
      if (isArabic) {
        window.moveSlide(-1);
      } else {
        window.moveSlide(1);
      }
    }
    if (_0x5b069b > _0xc4343 + _0x19e839) {
      if (isArabic) {
        window.moveSlide(1);
      } else {
        window.moveSlide(-1);
      }
    }
  }
  let _0x10fef6 = false;
  let _0x6d38c6 = 0;
  const _0x5e5043 = document.querySelector(".modal-container");
  _0x5e5043.addEventListener("mousedown", (_0x539276) => {
    if (!document.getElementById("s-track")) {
      return;
    }
    _0x10fef6 = true;
    _0x6d38c6 = _0x539276.pageX;
    _0x5e5043.style.cursor = "grabbing";
  });
  const _0x23835c = (_0x2ec34e) => {
    if (!_0x10fef6) {
      return;
    }
    const _0x373556 = _0x2ec34e.pageX;
    const _0x255d6f = _0x373556 - _0x6d38c6;
    const _0x356696 = 70;
    if (_0x255d6f < -_0x356696) {
      if (isArabic) {
        window.moveSlide(-1);
      } else {
        window.moveSlide(1);
      }
    }
    if (_0x255d6f > _0x356696) {
      if (isArabic) {
        window.moveSlide(1);
      } else {
        window.moveSlide(-1);
      }
    }
    _0x10fef6 = false;
    _0x5e5043.style.cursor = "grab";
  };
  _0x5e5043.addEventListener("mouseup", _0x23835c);
  _0x5e5043.addEventListener("mouseleave", _0x23835c);
  function _0x3454e9(_0xbccbc7) {
    const _0x3d3a38 = document.getElementById("modal-counter");
    if (!_0x3d3a38) {
      return;
    }
    _0x3d3a38.textContent = window.currentSlideIndex + 1 + " / " + _0xbccbc7;
  }
  window.closeMasterModal = () => {
    const _0x29f60e = document.getElementById("master-modal");
    const _0x32c68b = document.getElementById("modal-content-area");
    _0x29f60e.classList.remove("active");
    setTimeout(() => {
      _0x32c68b.innerHTML = "";
    }, 300);
  };
  document
    .getElementById("master-modal")
    .addEventListener("click", function (_0x757fed) {
      if (_0x757fed.target === this) {
        closeMasterModal();
      }
    });
  const _0x40d8b5 = () => {
    const _0x63ae39 = document.getElementById("btn-menu-toggle");
    const _0x15ac7c = _0x164713.querySelector(".nav-links-container");
    const _0x49cbfe = _0x15ac7c.querySelectorAll(".btn-primary-nav");
    _0x49cbfe.forEach((_0x25ba46) => {
      _0x25ba46.addEventListener("click", (_0x664e6c) => {
        const _0x85b802 = _0x25ba46.getAttribute("data-flow");
        const _0x176794 = _0x25ba46.innerText.trim();
        generateAndProcessResponse(_0x176794);
        _0x164713.classList.remove("menu-active");
        document.body.classList.remove("open-menu");
      });
      _0x585ac3.push(_0x25ba46);
    });
    if (_0x63ae39) {
      _0x63ae39.onclick = (_0x28777a) => {
        document.body.classList.toggle("open-menu");
        _0x28777a.stopPropagation();
        _0x164713.classList.toggle("menu-active");
      };
    }
    document.addEventListener("click", (_0x5ec79b) => {
      const _0x3d14db = _0x164713.contains(_0x5ec79b.target);
      const _0x495a3b = _0x63ae39 && _0x63ae39.contains(_0x5ec79b.target);
      if (
        _0x164713.classList.contains("menu-active") &&
        !_0x3d14db &&
        !_0x495a3b
      ) {
        _0x164713.classList.remove("menu-active");
        document.body.classList.remove("open-menu");
      }
    });
  };
  _0x40d8b5();
  _0x46eafa();
  chatInput.addEventListener("input", toggleSendButtonState);
  sendButton.addEventListener("click", () => {
    if (!sendButton.disabled) {
      generateAndProcessResponse(chatInput.value);
    }
  });
  chatInput.addEventListener("keypress", (_0x5511cc) => {
    if (_0x5511cc.key === "Enter") {
      _0x5511cc.preventDefault();
      if (chatInput.value.trim() !== "") {
        generateAndProcessResponse(chatInput.value);
      }
    }
  });
  toggleSendButtonState();
});
window.addEventListener("load", () => {
  initializeFlows();
  const _0x4fc9eb = document.getElementById("preloader");
  if (_0x4fc9eb) {
    setTimeout(() => {
      _0x4fc9eb.classList.add("preloaded");
    }, 800);
  }
});