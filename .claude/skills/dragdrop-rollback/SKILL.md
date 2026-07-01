---
name: dragdrop-rollback
description: >-
  Implement a Kanban drag-and-drop move that updates the UI optimistically, persists the
  new status through the service layer, and reverts on failure. Use when a card can be
  dragged between board columns/states and the change must survive a refresh.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Optimistic board move with rollback

Cards move between the fixed 5 states (REQUIREMENTS §8). The API is the system of
record, so a move must **persist**, but the UI should feel instant. Pattern: apply
optimistically → call the service → **revert on failure**.

## The invariant

The DnD wiring is transport-agnostic; the **board owns** the optimistic update and the
revert. `FE/src/features/move-ticket/useBoardDnd.ts` only reports "ticket X dropped on
status Y" via `onMove` — it never touches the API.

## Steps

1. **Keep the DnD hook dumb.** Reuse `useBoardDnd(onMove)` — native HTML5 DnD, custom
   MIME type, no library. It calls `onMove(ticketId, toStatus)` on drop. Don't add API
   calls here.

2. **Snapshot, then apply optimistically.** In the board model
   (`FE/src/widgets/kanban-board/model/useBoard.ts`), on `onMove`: capture the ticket's
   current status, then move the card in local state immediately so the UI updates.

3. **Persist through the service.** Call the move service (returns `Result<T>` via
   `runRequest`) — e.g. `boardService` in `FE/src/widgets/kanban-board/api/`. No
   `try/catch` in the hook; branch on the `Result`.

4. **Revert on failure.** If `Result.ok === false`, restore the snapshotted status and
   surface the `error` (toast/inline). Never leave the card in a state the server
   rejected — the board must match the backend after the dust settles.

5. **Guard no-op moves.** Dropping onto the same column shouldn't fire a request.

6. **Test.** Assert: optimistic move renders instantly; on service failure the card
   returns to its origin column and an error is shown; on success it stays and no extra
   refetch is needed.

## Reference

- DnD wiring: `FE/src/features/move-ticket/useBoardDnd.ts`
- Board state: `FE/src/widgets/kanban-board/model/useBoard.ts`
- `Result` + `runRequest`: `FE/src/shared/api/result.ts`
