# Phase 19 — Analyse et conception du backend TransferePro

**Date** : 2026-08-24  
**Version** : 1.0  
**Statut** : Analyse complète — Prêt pour implémentation backend

---

## 1. Résumé de l'application

TransferePro est une application de gestion de transferts d'argent avec deux rôles :

- **AGENT** : crée des transferts, reçoit des transferts, effectue des paiements, annule ses propres transferts créés
- **ADMIN** : valide les inscriptions, gère les agents, gère les villes, supervise les transferts, effectue des récupérations financières

Le frontend est actuellement connecté à JSON Server. L'objectif est de concevoir un backend Node.js + Express + TypeScript + Prisma + PostgreSQL prêt à remplacer JSON Server.

---

## 2. Architecture frontend analysée

### Structure des dossiers
```
src/
├── components/common/          # Composants partagés (BackButton)
├── features/
│   ├── admin/                  # Espace administrateur
│   │   ├── layout/AdminLayout.tsx
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminAgentsPage.tsx
│   │   │   ├── AdminAgentDetailsPage.tsx
│   │   │   ├── AdminCitiesPage.tsx
│   │   │   ├── AdminTransfersPage.tsx
│   │   │   ├── AdminTransferDetailsPage.tsx
│   │   │   └── AdminFinancialStatisticsPage.tsx
│   │   ├── agents/services/agentService.ts
│   │   ├── transfers/services/transferService.ts
│   │   └── utils/financialStats.ts
│   ├── agent/                  # Espace agent
│   │   ├── layout/AgentLayout.tsx
│   │   └── pages/
│   │       ├── AgentHomePage.tsx
│   │       ├── AgentDashboard.css
│   │       └── ...
│   ├── auth/                   # Authentification
│   │   ├── context/AuthContext.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── services/authService.ts
│   │   ├── components/ProtectedRoute.tsx
│   │   ├── components/RoleRoute.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       └── PendingValidationPage.tsx
│   ├── transfers/              # Gestion des transferts
│   │   ├── services/
│   │   │   ├── transferService.ts
│   │   │   ├── cashCollectionService.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── calculateTransferFee.ts
│   │   │   └── agentStatsUtils.ts
│   │   ├── components/
│   │   │   ├── TransferStatusBadge.tsx
│   │   │   └── ...
│   │   └── pages/
│   │       ├── CreateTransferPage.tsx
│   │       ├── IncomingTransfersPage.tsx
│   │       ├── TransferDetailsPage.tsx
│   │       ├── VerifyWithdrawalCodePage.tsx
│   │       ├── PaymentSuccessPage.tsx
│   │       ├── TransferCreatedPage.tsx
│   │       └── TransferHistoryPage.tsx
│   └── cities/
│       └── services/
│           └── cityService.ts
├── services/
│   └── api.ts                  # Client HTTP centralisé
├── types/
│   └── index.ts                # Types globaux
└── App.tsx                     # Routes

### Services frontend (contrats à respecter)
- `agentService` : CRUD agents, activation/blocage, règles métier
- `transferService` : CRUD transferts, transitions de statut, annulation, paiement
- `cityService` : CRUD villes, disponibilité pour inscription
- `cashCollectionService` : récupérations financières
- `authService` : login, register, logout, me

### Routes frontend
```
PUBLIC:
  GET  /login
  GET  /register
  GET  /pending-validation

AGENT:
  GET  /agent
  GET  /agent/transfers/new
  GET  /agent/transfers/incoming
  GET  /agent/transfers/history
  GET  /agent/transfers/:id
  GET  /agent/transfers/:id/verify
  GET  /agent/transfers/:id/payment-success
  GET  /agent/transfers/:id/success

ADMIN:
  GET  /admin
  GET  /admin/agents
  GET  /admin/agents/:id
  GET  /admin/cities
  GET  /admin/transfers
  GET  /admin/transfers/:id
  GET  /admin/financial-statistics
```

---

## 3. Entités identifiées

### 3.1 Entité unique : User

**Recommandation** : Utiliser une seule entité `User` avec un champ `role`.

**Justification** :
- ADMIN et AGENT partagent les mêmes champs de base (id, firstName, lastName, phone, email, password, city, createdAt, updatedAt)
- La seule différence est le `role` (ADMIN vs AGENT)
- Cela simplifie les relations et les jointures
- Permet de partager l'authentification et l'autorisation

**Champs** :

| Champ | Type | Contraintes |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| firstName | string | NOT NULL |
| lastName | string | NOT NULL |
| phone | string | NOT NULL, unique |
| email | string | NOT NULL, unique |
| password | string | NOT NULL (hashé) |
| city | string | NOT NULL |
| role | enum(ADMIN, AGENT) | NOT NULL |
| status | enum(PENDING, ACTIVE, BLOCKED, REFUSED) | NOT NULL, default PENDING |
| createdAt | DateTime | NOT NULL |
| updatedAt | DateTime | NOT NULL |

**Relations** :
- Un ADMIN peut créer plusieurs villes (via cashCollections.createdBy)
- Un ADMIN peut effectuer plusieurs récupérations (cashCollections)
- Un AGENT peut créer plusieurs transferts (transfers origin)
- Un AGENT peut recevoir plusieurs transferts (transfers destination)
- Un AGENT peut payer plusieurs transferts (transfers paidBy)
- Un AGENT peut avoir plusieurs récupérations (cashCollections)

### 3.2 Entité : City

| Champ | Type | Contraintes |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| name | string | NOT NULL, unique (insensible à la casse) |
| isActive | boolean | NOT NULL, default true |
| createdAt | DateTime | NOT NULL |

**Relations** :
- Une City a plusieurs Users (agents)
- Une City est référencée dans plusieurs Transfers (originCity, destinationCity)

### 3.3 Entité : Transfer

| Champ | Type | Contraintes |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| reference | string | NOT NULL, unique |
| senderName | string | NOT NULL |
| senderPhone | string | NOT NULL |
| receiverName | string | NOT NULL |
| receiverPhone | string | NOT NULL |
| originAgentId | string (FK → User.id) | NOT NULL |
| destinationAgentId | string (FK → User.id) | NOT NULL |
| paidByAgentId | string (FK → User.id) | NULL |
| originCity | string | NOT NULL |
| destinationCity | string | NOT NULL |
| amount | integer | NOT NULL, >= 1000 |
| fee | integer | NOT NULL, >= 0 |
| totalAmount | integer | NOT NULL, = amount + fee |
| withdrawalCode | string | NOT NULL (4 chiffres) |
| status | enum(CREATED, READY_FOR_PAYMENT, PAID, CANCELLED) | NOT NULL, default CREATED |
| createdAt | DateTime | NOT NULL |
| updatedAt | DateTime | NOT NULL |
| paidAt | DateTime | NULL |

**Relations** :
- originAgent → User (celui qui a créé le transfert)
- destinationAgent → User (celui qui reçoit le transfert)
- paidByAgent → User (celui qui a effectué le paiement)

### 3.4 Entité : CashCollection

| Champ | Type | Contraintes |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| agentId | string (FK → User.id) | NOT NULL |
| amount | integer | NOT NULL, > 0 |
| collectedAt | DateTime | NOT NULL |
| createdBy | string (FK → User.id) | NOT NULL (ADMIN) |
| notes | string | NULL |
| createdAt | DateTime | NOT NULL |

**Relations** :
- agent → User (agent concerné par la récupération)
- createdByAdmin → User (ADMIN qui a enregistré)

---

## 4. Modèle de données PostgreSQL

```
User (id, firstName, lastName, phone, email, password, city, role, status, createdAt, updatedAt)
  ├── transfersOrigin (Transfer.originAgentId)
  ├── transfersDestination (Transfer.destinationAgentId)
  ├── transfersPaid (Transfer.paidByAgentId)
  ├── cashCollections (CashCollection.agentId)
  └── cashCollectionsCreated (CashCollection.createdBy)

City (id, name, isActive, createdAt)
  ├── users (User.city)
  └── transfersOriginCity (Transfer.originCity)
  └── transfersDestinationCity (Transfer.destinationCity)

Transfer (id, reference, ..., originAgentId, destinationAgentId, paidByAgentId, ..., createdAt, updatedAt, paidAt)
  ├── originAgent → User
  ├── destinationAgent → User
  └── paidByAgent → User

CashCollection (id, agentId, amount, collectedAt, createdBy, notes, createdAt)
  ├── agent → User
  └── createdByAdmin → User
```

### Relations
- **User 1—N Transfer** (as originAgent)
- **User 1—N Transfer** (as destinationAgent)
- **User 1—N Transfer** (as paidByAgent)
- **User 1—N CashCollection** (as agent)
- **User 1—N CashCollection** (as createdBy)
- **City 1—N User**
- **City 1—N Transfer** (as originCity)
- **City 1—N Transfer** (as destinationCity)

---

## 5. Contraintes PostgreSQL recommandées

### User
- `email` : UNIQUE, NOT NULL
- `phone` : UNIQUE, NOT NULL
- `city` : NOT NULL, référence à City.name ou City.id
- `role` : CHECK IN ('ADMIN', 'AGENT')
- `status` : CHECK IN ('PENDING', 'ACTIVE', 'BLOCKED', 'REFUSED')

### City
- `name` : UNIQUE (utiliser LOWER(name) pour insensibilité à la casse)
- `isActive` : NOT NULL, DEFAULT true

### Transfer
- `reference` : UNIQUE, NOT NULL
- `amount` : CHECK (amount >= 1000)
- `fee` : CHECK (fee >= 0)
- `totalAmount` : CHECK (totalAmount = amount + fee)
- `withdrawalCode` : CHECK (LENGTH(withdrawalCode) = 4)
- `status` : CHECK IN ('CREATED', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED')
- `originAgentId` : FK → User.id
- `destinationAgentId` : FK → User.id
- `paidByAgentId` : FK → User.id, NULLABLE
- `paidAt` : NULLABLE
- Contrainte : `originAgentId != destinationAgentId`

### CashCollection
- `agentId` : FK → User.id
- `createdBy` : FK → User.id
- `amount` : CHECK (amount > 0)
- `collectedAt` : NOT NULL

---

## 6. Index recommandés

### User
- `idx_user_email` sur `email`
- `idx_user_phone` sur `phone`
- `idx_user_city` sur `city`
- `idx_user_role` sur `role`
- `idx_user_status` sur `status`

### City
- `idx_city_name` sur `LOWER(name)`
- `idx_city_active` sur `isActive`

### Transfer
- `idx_transfer_reference` sur `reference`
- `idx_transfer_origin_agent` sur `originAgentId`
- `idx_transfer_destination_agent` sur `destinationAgentId`
- `idx_transfer_paid_by` sur `paidByAgentId`
- `idx_transfer_status` sur `status`
- `idx_transfer_created_at` sur `createdAt`
- `idx_transfer_destination_city` sur `destinationCity`

### CashCollection
- `idx_cash_collection_agent` sur `agentId`
- `idx_cash_collection_collected_at` sur `collectedAt`
- `idx_cash_collection_created_by` sur `createdBy`

---

## 7. Rôles et permissions

### ADMIN
- Peut consulter tous les users, transferts, villes
- Peut créer/modifier/supprimer des villes
- Peut activer/bloquer/réactiver/refuser des agents
- Peut consulter toutes les statistiques financières
- Peut enregistrer des récupérations financières
- Peut consulter l'historique des récupérations
- Peut annuler n'importe quel transfert (à confirmer)

### AGENT
- Peut consulter son propre profil
- Peut créer des transferts
- Peut consulter ses transferts entrants
- Peut consulter son historique de transferts
- Peut vérifier le code de retrait (seulement pour les transferts qu'il reçoit)
- Peut effectuer un paiement (seulement pour les transferts qu'il reçoit et prêts)
- Peut annuler ses propres transferts créés (seulement si CREATED)
- Peut consulter ses propres statistiques financières
- Peut consulter l'historique de ses récupérations

### Authentification
- Inscription publique → statut PENDING
- Connexion : email + mot de passe
- JWT avec expiration
- Refresh token à prévoir

---

## 8. Statuts et transitions

### UserStatus
| Statut | Signification | Qui peut modifier |
|--------|--------------|-------------------|
| PENDING | Inscription en attente de validation | ADMIN |
| ACTIVE | Compte actif, peut utiliser l'application | ADMIN |
| BLOCKED | Compte bloqué, ne peut plus se connecter | ADMIN |
| REFUSED | Inscription refusée | ADMIN |

**Transitions UserStatus** :
- PENDING → ACTIVE (validation ADMIN)
- PENDING → REFUSED (refus ADMIN)
- ACTIVE → BLOCKED (blocage ADMIN)
- BLOCKED → ACTIVE (réactivation ADMIN)
- REFUSED → ACTIVE (réactivation ADMIN)

### TransferStatus
| Statut | Signification | Qui peut modifier |
|--------|--------------|-------------------|
| CREATED | Transfert créé, en attente de vérification du code | Agent créateur (annulation), Agent destination (vérification code) |
| READY_FOR_PAYMENT | Code vérifié, prêt pour paiement | Agent destination (paiement) |
| PAID | Paiement effectué | Aucune modification possible |
| CANCELLED | Transfert annulé | Aucune modification possible |

**Transitions TransferStatus** :
```
CREATED → READY_FOR_PAYMENT (vérification code par destinationAgent)
CREATED → CANCELLED (annulation par originAgent)

READY_FOR_PAYMENT → PAID (paiement par destinationAgent)
```

**Transitions interdites** :
- PAID → any
- CANCELLED → any
- READY_FOR_PAYMENT → CREATED
- READY_FOR_PAYMENT → CANCELLED

---

## 9. Règles métier des agents

### Inscription
1. Formulaire public : firstName, lastName, phone, email, password, city
2. Le champ city est peuplé avec les villes disponibles (actives + sans agent ACTIVE)
3. Création avec statut PENDING
4. Aucune connexion possible tant que PENDING
5. Notification/admin doit valider

### Validation par ADMIN
1. ADMIN voit les agents PENDING
2. ADMIN peut activer → PENDING → ACTIVE
3. ADMIN peut refuser → PENDING → REFUSED
4. Règle : une ville ne peut avoir qu'un seul agent ACTIVE à la fois

### Activation
- Vérifier qu'aucun autre agent ACTIVE n'existe dans la même ville
- Si un agent ACTIVE existe déjà → erreur
- Les agents PENDING, BLOCKED, REFUSED ne bloquent pas la ville

### Blocage
- ADMIN peut bloquer un agent ACTIVE → status = BLOCKED
- Un agent BLOCKED ne peut plus se connecter
- Un agent BLOCKED libère la ville (devient disponible pour un nouvel agent)

### Réactivation
- ADMIN peut réactiver un agent BLOCKED ou REFUSED → status = ACTIVE
- Vérifier la règle de ville (un seul ACTIVE par ville)

### Changement de ville
- Non prévu dans le frontend actuel
- Si implémenté : vérifier disponibilité nouvelle ville + libération ancienne ville

---

## 10. Règles métier des villes

### Création
1. Nom requis, trim automatique
2. Comparaison insensible à la casse
3. Pas de doublons
4. isActive = true par défaut

### Modification
1. Nom optionnel, avec mêmes validations que création
2. Vérifier unicité (insensible à la casse)

### Activation
1. city.isActive = true
2. Vérifier disponibilité (pas d'agent ACTIVE)

### Désactivation
1. city.isActive = false
2. **CONTRAINTE** : impossible si un agent ACTIVE existe dans cette ville
3. L'admin doit d'abord bloquer l'agent actif
4. Les transferts existants restent intacts

### Disponibilité pour inscription
- Ville disponible si :
  - isActive = true
  - Aucun agent avec role = AGENT et status = ACTIVE dans cette ville
- Les agents PENDING, BLOCKED, REFUSED ne rendent pas la ville indisponible

---

## 11. Règles métier des transferts

### Création
1. Seul un AGENT ACTIVE peut créer un transfert
2. L'agent ne peut pas créer un transfert vers sa propre ville
3. La ville de destination doit avoir un agent ACTIVE
4. Génération automatique :
   - reference : TRF-YYYY-XXXX
   - withdrawalCode : 4 chiffres aléatoires
   - totalAmount = amount + fee
   - status = CREATED
   - paidAt = null
   - paidByAgentId = null
5. amount >= 1000
6. fee calculé selon la grille : 250 F par tranche de 5000 F

### Calcul des frais
```
Montant minimum : 1000 F
Tranche : 5000 F
Frais par tranche : 250 F

Formule : Math.ceil((amount - 999) / 5000) * 250

Exemples :
1000 F → 1 tranche → 250 F
5000 F → 1 tranche → 250 F
5001 F → 2 tranches → 500 F
10000 F → 2 tranches → 500 F
10001 F → 3 tranches → 750 F
15000 F → 3 tranches → 750 F
15001 F → 4 tranches → 1000 F
```

### Vérification du code de retrait
1. Seul l'agent destination peut vérifier le code
2. Le transfert doit être en status CREATED
3. Le code fourni doit correspondre exactement au withdrawalCode
4. Transition : CREATED → READY_FOR_PAYMENT
5. Le code ne doit jamais être exposé dans les listes ou statistiques

### Paiement
1. Seul l'agent destination peut effectuer le paiement
2. Le transfert doit être en status READY_FOR_PAYMENT
3. Transition : READY_FOR_PAYMENT → PAID
4. Enregistrement de paidAt = now
5. Enregistrement de paidByAgentId = agent connecté
6. Un transfert PAYÉ ne peut plus être modifié ou annulé

### Annulation
1. Seul l'agent créateur (originAgent) peut annuler
2. Le transfert doit être en status CREATED
3. Transition : CREATED → CANCELLED
4. Un transfert READY_FOR_PAYMENT ne peut plus être annulé
5. Un transfert PAYÉ ne peut pas être annulé
6. Un transfert CANCELLÉ ne peut plus être modifié

---

## 12. Paiement et code de retrait

### Génération du code
- Généré à la création du transfert
- 4 chiffres aléatoires
- Stocké en clair dans la DB (JSON Server actuel)
- En production : considérer un hachage ou chiffrement

### Vérification
- Comparaison directe avec le code stocké
- Aucune limite de tentatives dans le frontend actuel
- À sécuriser côté backend (rate limiting recommandé)

### Sécurité
- Le code ne doit jamais être retourné dans les listes
- Le code ne doit jamais être retourné dans les statistiques
- Le code ne doit être retourné que dans la page de détails du créateur
- En production : considérer le chiffrement du code en DB

---

## 13. Logique financière

### Montant encaissé (totalCollected)
```
Somme de (amount + fee) pour tous les transferts :
- créés par l'agent (originAgentId)
- status != CANCELLED
- createdAt > période_active_start (si une récupération existe)
```

### Montant décaissé (totalDebited)
```
Somme de (amount) pour tous les transferts :
- payés par l'agent (paidByAgentId)
- status = PAID
- createdAt > période_active_start (si une récupération existe)
```

### Frais générés (feesGenerated)
```
Somme de (fee) pour tous les transferts :
- créés par l'agent (originAgentId)
- status != CANCELLED
- createdAt > période_active_start (si une récupération existe)
```

### Solde opérationnel (operationalBalance)
```
totalCollected - totalDebited
```

### Période active
- Pas de récupération : tous les transferts sont pris en compte
- Avec récupération : uniquement les transferts avec createdAt > collectedAt de la dernière récupération

---

## 14. Récupérations financières

### Entité CashCollection
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| agentId | UUID | Agent concerné |
| amount | integer | Montant récupéré |
| collectedAt | DateTime | Date/heure réelle de la récupération |
| createdBy | UUID | ADMIN qui a enregistré |
| notes | string | Notes optionnelles |
| createdAt | DateTime | Date d'enregistrement |

### Règles
1. Seul un ADMIN peut créer une récupération
2. amount > 0
3. amount <= solde opérationnel de l'agent (selon la période active)
4. La récupération est définitive (pas de suppression/modification)
5. Après création : nouvelle période commence après collectedAt
6. L'historique est en lecture seule

### Période financière
- Début : createdAt du premier transfert (pas de récupération) OU collectedAt de la dernière récupération
- Fin : now
- Les statistiques utilisent uniquement les transferts de cette période

### Points à valider
- **Récupération partielle** : le frontend autorise un montant < solde opérationnel. Cela crée une incohérence : le solde restant n'est jamais "réinitialisé" car la période entière est exclue après collectedAt. Il faut valider si :
  - Option A : la récupération doit toujours être égale au solde opérationnel
  - Option B : la période n'est pas réinitialisée, seul le montant est déduit
  - Option C : on autorise les récupérations partielles mais on garde une trace du solde restant

---

## 15. Authentification et autorisation

### Inscription
1. Route publique POST /api/auth/register
2. Création User avec role = AGENT, status = PENDING
3. Mot de passe hashé (bcrypt)
4. Retourne l'user créé (sans password)

### Connexion
1. Route publique POST /api/auth/login
2. Email + password
3. Vérification hash
4. Vérification status != BLOCKED, != REFUSED
5. Génération JWT (access token + refresh token)
6. Retourne user + token

### Middleware d'authentification
1. Vérification du JWT dans Authorization header
2. Extraction de l'user depuis le token
3. Ajout de user dans req
4. 401 si token invalide/expiré

### Middleware de rôle
1. Vérification du rôle dans req.user
2. 403 si rôle non autorisé
3. Routes ADMIN réservées aux ADMIN
4. Routes AGENT réservées aux AGENT

### Protection des ressources
- Un agent ne peut accéder qu'à ses propres transferts
- Un agent ne peut accéder qu'à ses propres statistiques
- Un agent ne peut accéder qu'à ses propres récupérations
- Un admin peut tout voir sauf les données sensibles d'autres admins

---

## 16. API REST à concevoir

### AUTH
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| POST | /api/auth/register | Public | Inscription agent |
| POST | /api/auth/login | Public | Connexion |
| POST | /api/auth/refresh | Authentifié | Refresh token |
| GET | /api/auth/me | Authentifié | Profil connecté |

### USERS (ADMIN uniquement)
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| GET | /api/users | ADMIN | Liste tous les users (agents) |
| GET | /api/users/:id | ADMIN | Détails d'un user |
| PATCH | /api/users/:id/status | ADMIN | Changer le statut |
| GET | /api/users/:id/stats | ADMIN | Statistiques d'un agent |
| GET | /api/users/:id/collections | ADMIN | Historique récupérations |

### CITIES (ADMIN uniquement)
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| GET | /api/cities | ADMIN | Liste toutes les villes |
| GET | /api/cities/:id | ADMIN | Détails d'une ville |
| POST | /api/cities | ADMIN | Créer une ville |
| PATCH | /api/cities/:id | ADMIN | Modifier une ville |
| PATCH | /api/cities/:id/activate | ADMIN | Activer une ville |
| PATCH | /api/cities/:id/deactivate | ADMIN | Désactiver une ville |
| GET | /api/cities/available | Public/AGENT | Villes disponibles pour inscription |

### TRANSFERS
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| POST | /api/transfers | AGENT | Créer un transfert |
| GET | /api/transfers | AGENT/ADMIN | Liste transferts (filtrée par rôle) |
| GET | /api/transfers/:id | AGENT/ADMIN | Détails d'un transfert |
| PATCH | /api/transfers/:id/cancel | AGENT | Annuler un transfert (origine only) |
| PATCH | /api/transfers/:id/verify-code | AGENT | Vérifier le code (destination only) |
| PATCH | /api/transfers/:id/mark-paid | AGENT | Marquer comme payé (destination only) |
| GET | /api/transfers/incoming | AGENT | Transferts entrants |
| GET | /api/transfers/history | AGENT | Historique agent |
| GET | /api/transfers/stats | AGENT | Statistiques agent |

### CASH COLLECTIONS
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| POST | /api/cash-collections | ADMIN | Enregistrer une récupération |
| GET | /api/cash-collections | ADMIN | Liste toutes les récupérations |
| GET | /api/cash-collections/:id | ADMIN | Détails d'une récupération |
| GET | /api/cash-collections/agent/:agentId | ADMIN | Récupérations d'un agent |

### STATISTICS (ADMIN)
| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| GET | /api/statistics/financial | ADMIN | Statistiques financières globales |
| GET | /api/statistics/agents | ADMIN | Statistiques par agent |
| GET | /api/statistics/cities | ADMIN | Statistiques par ville |

---

## 17. Architecture Node.js + Express recommandée

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Connexion Prisma
│   │   ├── env.ts               # Variables d'environnement
│   │   └── jwt.ts               # Configuration JWT
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── cityController.ts
│   │   ├── transferController.ts
│   │   ├── cashCollectionController.ts
│   │   └── statisticsController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── cityService.ts
│   │   ├── transferService.ts
│   │   ├── cashCollectionService.ts
│   │   └── statisticsService.ts
│   ├── repositories/
│   │   ├── userRepository.ts
│   │   ├── cityRepository.ts
│   │   ├── transferRepository.ts
│   │   └── cashCollectionRepository.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── cityRoutes.ts
│   │   ├── transferRoutes.ts
│   │   ├── cashCollectionRoutes.ts
│   │   └── statisticsRoutes.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts    # Vérification JWT
│   │   ├── roleMiddleware.ts    # Vérification rôle
│   │   ├── errorMiddleware.ts   # Gestion centralisée erreurs
│   │   ├── validateMiddleware.ts # Validation Zod
│   │   └── notFoundMiddleware.ts
│   ├── validators/
│   │   ├── authValidator.ts
│   │   ├── userValidator.ts
│   │   ├── cityValidator.ts
│   │   ├── transferValidator.ts
│   │   └── cashCollectionValidator.ts
│   ├── utils/
│   │   ├── feeCalculator.ts
│   │   ├── statsCalculator.ts
│   │   └── appError.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts                   # Configuration Express
│   └── server.ts                # Démarrage serveur
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Responsabilités par dossier
- **config** : Configuration DB, JWT, env
- **controllers** : Couche HTTP, extraction params, appel services, retour réponse
- **services** : Logique métier pure (réutilisable)
- **repositories** : Accès données Prisma
- **routes** : Définition des endpoints et middleware
- **middlewares** : Auth, rôle, validation, erreurs
- **validators** : Schémas Zod
- **utils** : Fonctions utilitaires (calculs, erreurs)
- **types** : Types TypeScript partagés

---

## 18. Stratégie de validation

### Outil recommandé : Zod

### Validations nécessaires :

#### Inscription
- firstName : string, min 2, max 50
- lastName : string, min 2, max 50
- phone : string, pattern téléphone
- email : string, email format
- password : string, min 6
- city : string, non vide

#### Connexion
- email : string, email format
- password : string, non vide

#### Création ville
- name : string, min 2, max 100, trim

#### Création transfert
- senderName : string, min 2
- senderPhone : string, min 2
- receiverName : string, min 2
- receiverPhone : string, min 2
- destinationCity : string, non vide
- amount : number, min 1000

#### Vérification code
- code : string, length 4, digits only

#### Paiement
- Aucun body (utilisateur connecté)

#### Annulation
- Aucun body (utilisateur connecté)

#### Récupération financière
- agentId : string, UUID
- amount : number, > 0
- collectedAt : string, ISO datetime
- notes : string, optional, max 500

---

## 19. Stratégie de gestion des erreurs

### Format de réponse erreur
```json
{
  "message": "Description claire de l'erreur",
  "code": "ERROR_CODE",
  "details": []
}
```

### Codes HTTP
| Code | Usage |
|------|-------|
| 400 | Validation échouée, body invalide |
| 401 | Non authentifié, token manquant/invalide |
| 403 | Non autorisé (rôle, propriété) |
| 404 | Ressource introuvable |
| 409 | Conflit (ville occupée, doublon) |
| 422 | Transition de statut interdite |
| 500 | Erreur serveur |

### Middleware centralisé
- Capture toutes les erreurs
- Formate la réponse
- Log les erreurs serveur (sans exposé au client)
- Messages en français, génériques

---

## 20. Sécurité

### Authentification
- JWT avec expiration (access: 15min, refresh: 7 jours)
- Hash des mots de passe avec bcrypt (rounds: 10)
- Refresh tokens stockés en DB
- Logout → blacklist du token

### Autorisation
- Middleware `requireAuth` sur toutes les routes protégées
- Middleware `requireRole('ADMIN')` ou `requireRole('AGENT')`
- Vérification de propriété sur les ressources :
  - Agent ne peut accéder qu'à ses propres transferts
  - Agent ne peut payer que les transferts qu'il reçoit
  - Agent ne peut annuler que ses propres transferts créés

### Protection des données sensibles
- `password` jamais retourné dans les réponses
- `withdrawalCode` jamais retourné dans les listes/statistiques
- `withdrawalCode` retourné uniquement dans la page de détails du créateur
- En production : considérer chiffrement du code de retrait

### Validation
- Toutes les entrées validées avec Zod
- Sanitization des données
- Protection SQL injection via Prisma
- Rate limiting sur login et vérification code

---

## 21. Compatibilité avec le frontend

### Changements nécessaires

#### URLs
- JSON Server : `/api/agents`, `/api/transfers`, etc.
- Express : mêmes URLs (`/api/...`)
- Pas de changement frontend nécessaire

#### Formats de réponse
- JSON Server retourne des tableaux pour les endpoints liste
- Express peut retourner des tableaux identiques
- Prisma retourne des objets avec `$queryRaw` possible pour certaines requêtes complexes

#### Filtres
- JSON Server supporte `?status=CREATED&originAgentId=xxx`
- Express doit supporter les mêmes query params
- Utiliser Prisma `where` pour les filtres

#### Gestion des erreurs
- JSON Server retourne `{ message: "..." }` en cas d'erreur
- Express retournera le même format
- Frontend gère déjà les erreurs via try/catch

### Stratégie de migration
1. Développer le backend en parallèle
2. Configurer `VITE_API_URL` pour pointer vers le backend
3. Tester chaque endpoint individuellement
4. Basculer progressivement
5. Garder JSON Server en fallback si nécessaire

---

## 22. Points à valider avant implémentation backend

### 22.1 Récupération partielle
**Problème** : Le frontend autorise un montant de récupération < solde opérationnel. Après la récupération, la période est réinitialisée après `collectedAt`, donc les transferts antérieurs sont exclus. Si le montant récupéré est inférieur au solde, la différence est "perdue" dans les statistiques.

**Impact** : Incohérence entre le montant récupéré et les statistiques futures.

**Solutions** :
- A : Forcer le montant = solde opérationnel (pas de récupération partielle)
- B : Ne pas réinitialiser la période, seulement déduire le montant
- C : Garder une trace du solde restant dans CashCollection

**Recommandation** : Option A pour simplifier, ou Option B si les récupérations partielles sont métier.

### 22.2 Champs password dans les réponses
**Problème** : `AdminAgentDetailsPage.tsx` récupère les admins via `agentService.getById()` pour afficher leur nom. Si le backend retourne le password hashé, il ne doit pas être exposé.

**Impact** : Sécurité.

**Solution** : Toujours exclure `password` des réponses API. Utiliser un DTO de réponse.

### 22.3 withrawalCode sensible
**Problème** : Le code de retrait est stocké en clair dans JSON Server. En production, cela pose un problème de sécurité.

**Impact** : Fuite potentielle de codes de retrait.

**Solution** : Chiffrement en DB ou hachage avec vérification par comparaison hashée.

### 22.4 Unicité de la référence de transfert
**Problème** : La référence est générée côté frontend. Deux agents pourraient générer la même référence simultanément.

**Impact** : Conflit de données.

**Solution** : Générer la référence côté backend avec garantie d'unicité.

### 22.5 Calcul des frais
**Problème** : Le calcul des frais est fait côté frontend. Un utilisateur pourrait modifier le JavaScript pour envoyer un montant avec des frais incorrects.

**Impact** : Fraude possible.

**Solution** : Toujours recalculer les frais côté backend.

### 22.6 Règle "un seul agent ACTIF par ville"
**Problème** : Actuellement vérifiée dans `agentService.updateStatus()`. Doit être vérifiée côté backend pour la sécurité.

**Impact** : Plusieurs agents ACTIF dans la même ville.

**Solution** : Contrainte d'unicité partielle ou vérification transactionnelle.

---

## 23. Recommandations finales

1. **Démarrer par le modèle Prisma** : Créer le schema.prisma avec toutes les entités et relations
2. **Implémenter l'authentification en premier** : Base pour toutes les autres routes
3. **Respecter les contrats frontend** : Ne pas modifier les formats de réponse sans coordination
4. **Centraliser la logique financière** : Les calculs de statistiques et de frais doivent être dans le backend
5. **Tester chaque transition de statut** : Les transferts ont des règles métier strictes
6. **Prévoir les migrations** : Stratégie de migration depuis JSON Server
7. **Ne pas sur-ingénier** : L'architecture proposée est adaptée à la taille du projet
8. **Sécuriser le code de retrait** : Priorité pour la production

---

## 24. Checklist pour Phase 20

- [ ] Valider les points de la section 22
- [ ] Créer le schema Prisma
- [ ] Configurer la base PostgreSQL (Neon)
- [ ] Implémenter l'authentification JWT
- [ ] Implémenter les middlewares auth/role
- [ ] Implémenter les endpoints Users/Agents
- [ ] Implémenter les endpoints Cities
- [ ] Implémenter les endpoints Transfers
- [ ] Implémenter les endpoints CashCollections
- [ ] Implémenter les endpoints Statistics
- [ ] Ajouter la validation Zod sur tous les endpoints
- [ ] Tester avec Postman/Thunder Client
- [ ] Connecter le frontend au backend
- [ ] Tester tous les scénarios métier

---

*Fin du rapport Phase 19*
