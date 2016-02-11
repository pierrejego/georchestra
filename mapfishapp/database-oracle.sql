-- geOrchestra 
-- Script database installation Oracle 11G Georchestra


-- Mapfishapp 
CREATE USER mapfishapp IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;
GRANT ALL PRIVILEGES TO mapfishapp;

Hibernate: 
    drop table geodocs cascade constraints
Hibernate: 
    drop sequence hibernate_sequence
Hibernate: 
    create table geodocs (
        id number(19,0) not null,
        access_count number(10,0),
        raw_file_content clob,
        created_at timestamp,
        file_hash varchar2(255 char),
        last_access timestamp,
        standard varchar2(255 char),
        username varchar2(255 char),
        primary key (id)
    )
Hibernate: 
    create sequence hibernate_sequence
    
    CREATE TABLE "MAPFISHAPPDEV"."GEODOCS" 
   (	"ID" NUMBER(19,0) NOT NULL ENABLE, 
	"ACCESS_COUNT" NUMBER(10,0), 
	"RAW_FILE_CONTENT" CLOB, 
	"CREATED_AT" TIMESTAMP (6), 
	"FILE_HASH" VARCHAR2(255 CHAR), 
	"LAST_ACCESS" TIMESTAMP (6), 
	"STANDARD" VARCHAR2(255 CHAR), 
	"USERNAME" VARCHAR2(255 CHAR), 
	 PRIMARY KEY ("ID")
    
create table mapfishapp.geodocs (
  id NUMBER(20) primary key, -- 1 to 9223372036854775807 (~ 1E19)
  username varchar(200), -- can be NULL (eg: anonymous user)
  standard varchar(3) not null, -- eg: CSV, KML, SLD, WMC, GML
  raw_file_content CLOB not null, -- file content
  file_hash varchar(32) unique not null, -- md5sum
  created_at timestamp default  CURRENT_TIMESTAMP, -- creation date
  last_access timestamp , -- last access date
  access_count integer default 0 -- access count, defaults to 0
);
  
CREATE SEQUENCE mapfishapp.geodocsid;

CREATE OR REPLACE TRIGGER mapfishapp.geodocstrig 
BEFORE INSERT ON  mapfishapp.geodocs 
FOR EACH ROW

BEGIN
  SELECT mapfishapp.geodocsid.NEXTVAL
  INTO   :new.id
  FROM   dual;
END;
/

create index geodocs_file_hash on mapfishapp.geodocs (file_hash);
create index geodocs_username on mapfishapp.geodocs (username);
create index geodocs_standard on mapfishapp.geodocs (standard);
create index geodocs_created_at on mapfishapp.geodocs (created_at);
create index geodocs_last_access on mapfishapp.geodocs (last_access);
create index geodocs_access_count on mapfishapp.geodocs (access_count);
create index geodocs_access_count on mapfishapp.geodocs using btree(access_count);


-- Ldapadmin
--
-- Oracle database
--
CREATE USER ldapadmin IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;

--SET search_path TO ldapadmin,public,pg_catalog;
CREATE TABLE ldapadmin.user_token (
    "uid" VARCHAR2(50) NOT NULL primary key,
    token VARCHAR2(50),
    creation_date timestamp with time zone
);
 GRANT ALL PRIVILEGES to ldapadmin;
 

