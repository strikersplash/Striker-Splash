-- Create content management table
CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section, content_key)
);

-- Insert default content for home page
INSERT INTO site_content (section, content_key, content_value) VALUES
('home_hero', 'title', 'Striker Splash'),
('home_hero', 'subtitle', 'Test your football skills and compete for prizes!'),
('home_hero', 'description', 'Join our football challenge and see if you have what it takes to top the leaderboard.'),
('home_hero', 'banner_image', '/images/hero-image.jpg'),

('home_features', 'compete_title', 'Compete'),
('home_features', 'compete_description', 'Challenge yourself against other players and climb the leaderboard rankings.'),
('home_features', 'track_title', 'Track Progress'),
('home_features', 'track_description', 'Monitor your performance and see your improvement over time.'),
('home_features', 'win_title', 'Win Prizes'),
('home_features', 'win_description', 'Top performers can win exciting prizes and recognition.'),

('home_steps', 'step1_title', 'Register'),
('home_steps', 'step1_description', 'Create your player account'),
('home_steps', 'step2_title', 'Purchase Kicks'),
('home_steps', 'step2_description', 'Buy kicks for $1 each (min. 5 kicks)'),
('home_steps', 'step3_title', 'Compete'),
('home_steps', 'step3_description', 'Show your skills and score goals'),
('home_steps', 'step4_title', 'Win'),
('home_steps', 'step4_description', 'Top the leaderboard and win prizes'),

('about_main', 'title', 'About Striker Splash'),
('about_main', 'subtitle', 'The Ultimate Football Challenge'),
('about_main', 'description1', 'Striker Splash is Belize''s premier football skills competition, bringing together players of all ages and skill levels to test their accuracy, speed, and technique.'),
('about_main', 'description2', 'Founded in 2023, our competition has quickly become a favorite among football enthusiasts across the country, offering a fun and competitive environment for players to showcase their talents.'),
('about_main', 'how_it_works', 'Participants purchase "kicks" for $1 BZD each, with a maximum of 5 kicks per turn. Each kick is recorded on our leaderboard, helping players climb the rankings with every successful attempt.'),
('about_main', 'competition_vs_practice', 'When registering for an event, players can decide if they want to play competitively or just for practice. Both options cost the same ($1 per kick), but competition kicks will be counted for tournament rankings and official records.')

ON CONFLICT (section, content_key) DO NOTHING;
