# Tasks

1. Export исходных production variables во временный ignored-файл → verify: файл не отслеживается Git.
2. Add обеих variables в `academy-ecosystem-portfolio` → verify: `vercel env ls production` показывает два encrypted keys.
3. Redeploy portfolio project → verify: deployment `Ready`.
4. HTTP и logs smoke → verify: нет `MissingSecret` и отсутствия `DATABASE_URL`.
