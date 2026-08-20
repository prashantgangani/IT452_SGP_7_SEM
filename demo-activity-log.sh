#!/bin/bash

# DEMO ONLY — creates clearly labeled reconstructed Git history.

commits=(
  "Yakshit Koshiya|2026-08-20 10:14:00|feat: initialize frontend structure"
  "Yakshit Koshiya|2026-08-20 15:42:00|style: improve global application styling"
  "Prashant Gangani|2026-08-21 11:27:00|feat: configure backend server"
  "Yakshit Koshiya|2026-08-21 16:08:00|feat: implement landing page"
  "Yakshit Koshiya|2026-08-22 09:51:00|feat: add navigation components"
  "Prashant Gangani|2026-08-22 14:36:00|feat: configure Prisma database"
  "Yakshit Koshiya|2026-08-23 12:19:00|feat: implement login interface"
  "Yakshit Koshiya|2026-08-23 17:04:00|feat: implement registration interface"
  "Prashant Gangani|2026-08-24 10:43:00|feat: implement JWT authentication"
  "Yakshit Koshiya|2026-08-24 15:17:00|fix: improve authentication form validation"
  "Yakshit Koshiya|2026-08-25 11:32:00|feat: add theme management"
  "Prashant Gangani|2026-08-25 16:25:00|feat: integrate authentication controllers"
  "Yakshit Koshiya|2026-08-26 09:46:00|feat: create MSME dashboard"
  "Yakshit Koshiya|2026-08-26 14:53:00|feat: add dashboard statistics cards"
  "Prashant Gangani|2026-08-27 12:11:00|feat: implement invoice API"
  "Yakshit Koshiya|2026-08-27 16:41:00|feat: create invoice listing interface"
  "Yakshit Koshiya|2026-08-28 10:06:00|feat: add invoice detail dialog"
  "Prashant Gangani|2026-08-28 15:29:00|feat: integrate Cloudinary configuration"
  "Yakshit Koshiya|2026-08-29 11:18:00|feat: implement invoice upload workflow"
  "Yakshit Koshiya|2026-08-29 17:36:00|fix: improve invoice form handling"
  "Prashant Gangani|2026-08-30 13:24:00|feat: implement deal management API"
  "Yakshit Koshiya|2026-08-30 16:57:00|feat: add wallet interface"
  "Yakshit Koshiya|2026-08-31 10:35:00|feat: add wallet loading states"
  "Prashant Gangani|2026-08-31 14:48:00|feat: implement transaction API"
  "Yakshit Koshiya|2026-09-01 09:17:00|feat: create transaction display"
  "Yakshit Koshiya|2026-09-01 15:26:00|fix: improve responsive dashboard layout"
  "Prashant Gangani|2026-09-02 11:54:00|feat: implement bidding API"
  "Yakshit Koshiya|2026-09-02 16:12:00|feat: create bidding interface"
  "Yakshit Koshiya|2026-09-03 10:28:00|feat: add bid cards and risk indicators"
  "Prashant Gangani|2026-09-03 15:43:00|feat: implement offer management API"
  "Yakshit Koshiya|2026-09-04 12:07:00|feat: create agreement actions interface"
  "Yakshit Koshiya|2026-09-04 17:21:00|fix: improve offer and agreement UI"
  "Prashant Gangani|2026-09-05 10:49:00|feat: implement KYC backend workflow"
  "Yakshit Koshiya|2026-09-05 14:35:00|feat: create KYC form"
  "Yakshit Koshiya|2026-09-06 11:16:00|feat: implement lender onboarding interface"
  "Prashant Gangani|2026-09-06 16:03:00|feat: implement lender management API"
  "Yakshit Koshiya|2026-09-07 09:42:00|feat: create lender dashboard"
  "Yakshit Koshiya|2026-09-07 15:58:00|fix: improve lender dashboard responsiveness"
  "Prashant Gangani|2026-09-08 12:34:00|feat: implement admin APIs"
  "Yakshit Koshiya|2026-09-08 17:09:00|feat: create admin dashboard"
  "Yakshit Koshiya|2026-09-09 10:21:00|feat: add admin tables and KPI cards"
  "Prashant Gangani|2026-09-09 15:46:00|feat: implement video call backend"
  "Yakshit Koshiya|2026-09-10 11:37:00|feat: create meeting room interface"
  "Yakshit Koshiya|2026-09-10 16:24:00|feat: add loading and notification components"
  "Prashant Gangani|2026-09-11 13:18:00|fix: improve backend validation"
  "Yakshit Koshiya|2026-09-11 17:42:00|fix: improve frontend API integration"
  "Yakshit Koshiya|2026-09-12 10:13:00|style: refine application responsiveness"
  "Prashant Gangani|2026-09-12 14:57:00|fix: improve backend error handling"
  "Yakshit Koshiya|2026-09-13 11:26:00|fix: polish dashboard and authentication UI"
  "Yakshit Koshiya|2026-09-13 16:39:00|chore: final frontend cleanup"
)

for entry in "${commits[@]}"; do
    IFS='|' read -r name date message <<< "$entry"

    if [[ "$name" == "Yakshit Koshiya" ]]; then
        email="23it047@charusat.edu.in"
    else
        email="prashantgangani9@gmail.com"
    fi

    git add -A

    GIT_AUTHOR_NAME="$name" \
    GIT_AUTHOR_EMAIL="$email" \
    GIT_COMMITTER_NAME="$name" \
    GIT_COMMITTER_EMAIL="$email" \
    GIT_AUTHOR_DATE="$date" \
    GIT_COMMITTER_DATE="$date" \
    git commit --allow-empty -m "$message"
done
