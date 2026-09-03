-- ============================================================
-- content_sections table
-- One row per named section of the portfolio template.
-- The `data` JSON column holds the section's full content.
-- ============================================================

CREATE TABLE IF NOT EXISTS content_sections (
    section_key     VARCHAR(64)     NOT NULL,
    data            JSON            NOT NULL,
    updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed default content from theme/index.html
-- Uses INSERT IGNORE so re-running never overwrites live data.
-- ============================================================

INSERT IGNORE INTO content_sections (section_key, data) VALUES
('general', JSON_OBJECT(
    'siteName', 'David Johnson',
    'siteTitle', 'Frontend Web Developer',
    'verticalTextLeft', 'david Johnson',
    'verticalTextRight', 'web developer',
    'footerHintText', 'You can ask me about :  age · cv · education · experience · awards · hobbies',
    'chatAvatarUrl', 'img/chat-avatar.png',
    'activeSkin', 'multicolors2.css'
)),

('intro', JSON_OBJECT(
    'greeting', 'Hello!',
    'name', 'David',
    'title', 'Web Developer',
    'imageUrl', 'img/avatar-intro.png',
    'imageAlt', 'David Johnson',
    'quoteText', 'David is the secret weapon for any modern SaaS, he transformed our complex ideas into a high performance reality.',
    'quoteAuthor', 'Marc Hawkins - Adobe Director',
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'More About Me', 'action', 'about', 'styleClass', ''),
        JSON_OBJECT('label', 'See My Work', 'action', 'portfolio', 'styleClass', 'btn-secondary')
    )
)),

('about', JSON_OBJECT(
    'bio', 'I''m a frontend developer passionate about building clean, intuitive interfaces and meaningful <strong>digital experiences</strong> that people enjoy using.',
    'stats', JSON_ARRAY(
        JSON_OBJECT('icon', 'fa-regular fa-star', 'text', '9+ Years in Web Development'),
        JSON_OBJECT('icon', 'fa-solid fa-code', 'text', '62+ Completed Projects'),
        JSON_OBJECT('icon', 'fa-regular fa-face-grin-wide', 'text', '55+ Happy Customers'),
        JSON_OBJECT('icon', 'fa-regular fa-calendar-check', 'text', 'Available for Freelance'),
        JSON_OBJECT('icon', 'fa-regular fa-map', 'text', 'Based in London, UK')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'View My Skills', 'action', 'skills', 'styleClass', ''),
        JSON_OBJECT('label', 'View My Projects', 'action', 'projects', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'about, about me, about you, who are you, profile, bio, biography, introduction, who, you, me'
)),

('skills', JSON_OBJECT(
    'intro', 'Here are the tools and technologies I use daily to build reliable, modern interfaces with a strong focus on <strong>quality and performance.</strong>',
    'categories', JSON_ARRAY(
        JSON_OBJECT(
            'name', 'Frontend',
            'icon', 'fa-solid fa-laptop',
            'skills', JSON_ARRAY(
                JSON_OBJECT('name', 'HTML', 'rating', 5),
                JSON_OBJECT('name', 'Javascript', 'rating', 3),
                JSON_OBJECT('name', 'PHP', 'rating', 4),
                JSON_OBJECT('name', 'jQuery', 'rating', 5)
            )
        ),
        JSON_OBJECT(
            'name', 'Backend',
            'icon', 'fa-solid fa-database',
            'skills', JSON_ARRAY(
                JSON_OBJECT('name', 'Node.js', 'rating', 5),
                JSON_OBJECT('name', 'Python', 'rating', 4),
                JSON_OBJECT('name', 'Java', 'rating', 5)
            )
        )
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'View My Projects', 'action', 'projects', 'styleClass', ''),
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'skills, technologies, stack, tech, tools, what can you do, capabilities, show me your skills, services, what are you good at'
)),

('projects', JSON_OBJECT(
    'intro', 'Ready to view my recent work? I''ll walk you through my projects one at a time. Click <strong>Show Next Project</strong> below to keep going.',
    'items', JSON_ARRAY(
        JSON_OBJECT(
            'title', 'Gallery Project',
            'link', 'https://link-to-your-website.com',
            'image', 'img/projects/project-1.jpg',
            'mediaType', 'gallery',
            'summary', 'Interactive e-commerce website with multiple product views and zoom features built with React and Node js.',
            'gallery', JSON_ARRAY('img/projects/project-1-big.jpg', 'img/projects/project-2-big.jpg', 'img/projects/project-3-big.jpg')
        ),
        JSON_OBJECT(
            'title', 'YouTube Project',
            'link', 'https://link-to-your-website.com',
            'image', 'img/projects/project-2.jpg',
            'mediaType', 'youtube',
            'youtubeId', 'SjJhuZQlkbA',
            'summary', 'A short video showcasing the concept, key features, and the overall user experience in action.'
        ),
        JSON_OBJECT(
            'title', 'Image Project',
            'link', '',
            'image', 'img/projects/project-3.jpg',
            'mediaType', 'image',
            'summary', 'Interactive e-commerce website with multiple product views and zoom features built with React and Node js.'
        ),
        JSON_OBJECT(
            'title', 'MP4 Video Project',
            'link', 'https://link-to-your-website.com',
            'image', 'img/projects/project-4.jpg',
            'mediaType', 'video',
            'videoUrl', 'img/video.mp4',
            'summary', 'A launch video presenting the product vision, core features, and the experience delivered to users.'
        )
    ),
    'globalButtons', JSON_ARRAY(
        JSON_OBJECT('label', 'View My Clients', 'action', 'clients', 'styleClass', 'btn-secondary')
    ),
    'finalButtons', JSON_ARRAY(
        JSON_OBJECT('label', 'View My Clients', 'action', 'clients', 'styleClass', ''),
        JSON_OBJECT('label', 'Contact Me', 'action', 'contact', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'projects, portfolio, work, examples, case studies, show me, builds, apps, websites, creations, show me your work'
)),

('clients', JSON_OBJECT(
    'intro', 'I''ve had the pleasure of working with some <strong>amazing companies and brands</strong> over the years, here are a few of them :',
    'items', JSON_ARRAY(
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-391.png'),
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-393.png'),
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-406.png'),
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-408.png'),
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-410.png'),
        JSON_OBJECT('name', 'Logo Ipsum', 'logoUrl', 'img/clients/logoipsum-414.png')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Contact Me', 'action', 'contact', 'styleClass', ''),
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'clients, brands, partners, customers, collaborations'
)),

('contact', JSON_OBJECT(
    'intro', 'I''m always open to new projects, creative ideas and <strong>opportunities</strong>. Feel free to get in touch through any of the channels below.',
    'directContact', JSON_ARRAY(
        JSON_OBJECT('label', 'Email :', 'icon', 'fa-regular fa-envelope-open', 'value', 'david@website.com'),
        JSON_OBJECT('label', 'Phone :', 'icon', 'fa-brands fa-whatsapp', 'value', '+49 151 8025134')
    ),
    'socialLinks', JSON_ARRAY(
        JSON_OBJECT('icon', 'fa-brands fa-linkedin-in', 'url', 'https://linkedin.com', 'class', 'linkedin'),
        JSON_OBJECT('icon', 'fa-brands fa-github', 'url', 'https://github.com', 'class', 'github'),
        JSON_OBJECT('icon', 'fa-brands fa-facebook', 'url', 'https://facebook.com', 'class', 'facebook'),
        JSON_OBJECT('icon', 'fa-brands fa-twitter', 'url', 'https://twitter.com', 'class', 'twitter'),
        JSON_OBJECT('icon', 'fa-brands fa-instagram', 'url', 'https://instagram.com', 'class', 'instagram')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Send Me a Message', 'action', 'open_contact_form', 'styleClass', ''),
        JSON_OBJECT('label', 'View Projects', 'action', 'projects', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'contact, touch, reach, message, hire, email, message, reach, call'
)),

('hello', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'Hi there I''m <strong>David Johnson !</strong>'),
        JSON_OBJECT('tag', 'P', 'content', 'Please use the following commands to learn more about my journey :'),
        JSON_OBJECT('tag', 'P', 'content', '<strong>about</strong>, <strong>skills</strong>, <strong>projects</strong>, <strong>clients</strong>, <strong>contact</strong>.')
    ),
    'buttons', JSON_ARRAY(),
    'triggers', 'hi, hello, hey, greeting, yo'
)),

('hobbies', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'Beyond coding, I like to keep my mind and body active with these activities:'),
        JSON_OBJECT('tag', 'DIV', 'className', 'list-with-icons', 'items', JSON_ARRAY(
            '<i class="fas fa-camera"></i> <strong>Photography</strong> — Capturing urban landscapes and nature.',
            '<i class="fas fa-plane"></i> <strong>Traveling</strong> — Exploring new cultures and cuisines.',
            '<i class="fas fa-dumbbell"></i> <strong>Fitness</strong> — Hitting the gym to stay energized.',
            '<i class="fas fa-gamepad"></i> <strong>Gaming</strong> — Love immersive RPGs and strategy games.',
            '<i class="fas fa-headphones"></i> <strong>Music</strong> — Lo-fi beats while coding and rock for the road.',
            '<i class="fas fa-futbol"></i> <strong>Football</strong> — Playing in local leagues and following the beautiful game.'
        )),
        JSON_OBJECT('tag', 'P', 'content', 'Do you share any of these interests?')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Let''s Connect', 'action', 'contact', 'styleClass', ''),
        JSON_OBJECT('label', 'More About Me', 'action', 'about', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'hobbies, interests, fun, life, leisure'
)),

('age', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'I was born on March 15, 1999 in London, UK. I am currently <strong>27 years old</strong> and based in London.')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'More About Me', 'action', 'about', 'styleClass', ''),
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'age, old, how old are you, your age, born, birthdate, born'
)),

('cv', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'Absolutely! Here is my complete <strong>curriculum vitae.</strong>'),
        JSON_OBJECT('tag', 'P', 'content', 'Click the button below to download the PDF file.')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'assets/link-to-cv.pdf', 'styleClass', '')
    ),
    'triggers', 'cv, curriculum vitae, resume, your cv'
)),

('education', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'I graduated with a <strong>BS in Computer Science</strong> from London University in 2015,'),
        JSON_OBJECT('tag', 'P', 'content', 'You can find more detailed information about my academic journey in my <strong>CV.</strong>')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', ''),
        JSON_OBJECT('label', 'More About Me', 'action', 'about', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'education, university, degrees, studies, academic, graduation, diploma'
)),

('experience', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'I am currently working as a Senior **Full-Stack Developer** at <strong>TechVision Solutions,</strong> I joined the team in October 2021, where I lead the development of intuitive user interfaces.'),
        JSON_OBJECT('tag', 'P', 'content', 'You can find a comprehensive timeline of my entire professional journey by downloading my full CV below.')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', ''),
        JSON_OBJECT('label', 'View My Projects', 'action', 'projects', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'experience, career'
)),

('awards', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'I am committed to **continuous learning** and staying updated with industry standards and here is a list of the <strong>awards</strong> I got the last years :'),
        JSON_OBJECT('tag', 'UL', 'items', JSON_ARRAY(
            'AWS Solutions Architect',
            'Google Cloud Developer',
            'Meta Front-End Specialization'
        ))
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'Download CV', 'action', '', 'link', 'link-to-cv.pdf', 'styleClass', ''),
        JSON_OBJECT('label', 'View My Projects', 'action', 'projects', 'styleClass', 'btn-secondary')
    ),
    'triggers', 'awards, certificates, courses, training, certifications'
)),

('msg_success', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', '<strong>Your message was sent successfully! </strong>'),
        JSON_OBJECT('tag', 'P', 'content', 'Rest assured, I''ll be in touch with a proper response within 24 hours.')
    ),
    'buttons', JSON_ARRAY(
        JSON_OBJECT('label', 'View My Projects', 'action', 'projects', 'styleClass', ''),
        JSON_OBJECT('label', 'See my Hobbies', 'action', 'hobbies', 'styleClass', 'btn-secondary')
    ),
    'triggers', ''
)),

('error', JSON_OBJECT(
    'blocks', JSON_ARRAY(
        JSON_OBJECT('tag', 'P', 'content', 'I''m sorry, I didn''t quite catch that. Try one of these commands:'),
        JSON_OBJECT('tag', 'P', 'content', '<strong>about</strong>, <strong>skills</strong>, <strong>projects</strong>, <strong>clients</strong>, <strong>contact</strong>.')
    ),
    'buttons', JSON_ARRAY(),
    'triggers', ''
));
