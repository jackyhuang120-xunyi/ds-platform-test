-- 0002_create_views.sql
-- 创建与 SQLite 保持一致的三个业务视图

-- 1. 用户信息视图 (包含年龄计算)
CREATE OR REPLACE VIEW user_view AS
SELECT
       u.id,
       u.name,
       g.name AS gender,
       TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age,
       u.id_number,
       u.`group`,
       u.height,
       u.weight
FROM   `user` AS u,
       `gender` AS g
WHERE  u.gender = g.id;

-- 2. 训练记录视图
CREATE OR REPLACE VIEW train_record_view AS
SELECT
       tr.id,
       u.name AS user_name,
       u.id_number,
       g.name AS group_name,
       bp.name AS part_name,
       tt.name AS type_name,
       tr.begin_time AS `time`,
       tr.uid,
       u.`group` AS group_id,
       tr.part AS part_id,
       tr.type AS type_id
FROM   `user` AS u,
       `train_record` AS tr,
       `train_type` AS tt,
       `body_part` AS bp,
       `group` AS g
WHERE  u.id = tr.uid
         AND tr.type = tt.id
         AND tr.part = bp.id
         AND u.`group` = g.id
         AND tr.end_time IS NOT NULL;

-- 3. 测试记录视图
CREATE OR REPLACE VIEW test_record_view AS
SELECT
       tr.id,
       u.name AS user_name,
       u.id_number,
       g.name AS group_name,
       bp.name AS part_name,
       tt.name AS type_name,
       tr.begin_time AS `time`,
       tr.uid,
       u.`group` AS group_id,
       tr.part AS part_id,
       tr.type AS type_id
FROM   `user` AS u,
       `test_record` AS tr,
       `test_type` AS tt,
       `body_part` AS bp,
       `group` AS g
WHERE  u.id = tr.uid
         AND tr.type = tt.id
         AND tr.part = bp.id
         AND u.`group` = g.id
         AND tr.end_time IS NOT NULL;

ALTER TABLE user MODIFY height smallint;
