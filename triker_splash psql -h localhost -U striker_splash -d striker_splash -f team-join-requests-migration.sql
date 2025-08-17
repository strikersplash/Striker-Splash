                                        Table "public.team_members"
   Column   |            Type             | Collation | Nullable |                 Default                  
------------+-----------------------------+-----------+----------+------------------------------------------
 id         | integer                     |           | not null | nextval('team_members_id_seq'::regclass)
 team_id    | integer                     |           |          | 
 player_id  | integer                     |           |          | 
 is_captain | boolean                     |           |          | false
 joined_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "team_members_pkey" PRIMARY KEY, btree (id)
    "idx_team_members_player_id" btree (player_id)
    "idx_team_members_team_id" btree (team_id)
    "team_members_team_id_player_id_key" UNIQUE CONSTRAINT, btree (team_id, player_id)
Foreign-key constraints:
    "team_members_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id)
    "team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id)

                                        Table "public.team_members"
   Column   |            Type             | Collation | Nullable |                 Default                  
------------+-----------------------------+-----------+----------+------------------------------------------
 id         | integer                     |           | not null | nextval('team_members_id_seq'::regclass)
 team_id    | integer                     |           |          | 
 player_id  | integer                     |           |          | 
 is_captain | boolean                     |           |          | false
 joined_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "team_members_pkey" PRIMARY KEY, btree (id)
    "idx_team_members_player_id" btree (player_id)
    "idx_team_members_team_id" btree (team_id)
    "team_members_team_id_player_id_key" UNIQUE CONSTRAINT, btree (team_id, player_id)
Foreign-key constraints:
    "team_members_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id)
    "team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id)

