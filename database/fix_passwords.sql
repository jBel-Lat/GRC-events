-- Fix password hashes for test accounts
UPDATE admin SET password = '$2a$10$fCQBAUaF9D6/exdzeyp6BuBNUV4fqM22cgJ6ijPzrqPEmHfKDOWDi' WHERE username = 'admin';

UPDATE panelist SET password = '$2a$10$pQHJ1m/C96xpnq0ryRpL7.IGfbZ6sTJaCHktyEP7UL7HvpmT0pZn6' WHERE username IN ('panelist1', 'panelist2', 'panelist3');
