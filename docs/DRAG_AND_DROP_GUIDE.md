# 🔀 Drag & Drop Map Reordering Guide

## Overview

The admin dashboard now features an intuitive **drag & drop interface** for reordering maps in the "Maps Management" tab. This feature makes it easy to organize maps visually without typing order numbers manually.

## Version
- **Released**: December 25, 2025
- **Version**: 4.1.0
- **Status**: Production Ready

## Features

### ✨ Core Functionality
- **Interactive Drag & Drop**: Click and drag map rows to reorder them
- **Visual Feedback**: Drag handle (⋮⋮) clearly indicates interactive element
- **Real-time Persistence**: Changes saved automatically to database
- **Optimized Updates**: Only affected maps are updated (reduces server load)

### 🎨 User Experience Improvements
1. **Toast Notifications**
   - Success message: ✅ "Order updated (X maps)"
   - Error message: ❌ "Error updating order"
   - Auto-dismiss after 3 seconds
   - Appears in top-right corner

2. **Loading State**
   - Table becomes semi-transparent (50% opacity)
   - Drag functionality disabled during save
   - Visual indicator that operation is in progress
   - Prevents accidental double-clicks

3. **Row Highlighting**
   - Affected rows highlight in green for 2 seconds
   - Provides visual confirmation of changes
   - Automatically fades after completion

4. **Anti-spam Protection**
   - Multiple drag attempts blocked while saving
   - Prevents server overload and race conditions
   - User-friendly message if attempted during save

## How to Use

### Basic Reordering

1. **Open Admin Dashboard**
   ```
   http://localhost:3000/admin
   ```

2. **Navigate to Maps Tab**
   - Click the "Maps" tab in the navigation

3. **Drag to Reorder**
   - Locate the drag handle (⋮⋮) at the start of each row
   - Click and hold the drag handle
   - Drag the row up or down to new position
   - Release to drop

4. **Automatic Save**
   - No need to click "Save" - changes are saved automatically
   - Toast notification confirms success
   - If error occurs, you'll see error notification

### Example: Moving a Map Up
```
Before:
1. Map A
2. Map B  ← drag this
3. Map C

During drag:
Map B is highlighted and follows cursor

After drop:
1. Map B  ← now in position 1
2. Map A
3. Map C
```

## Technical Details

### What Gets Updated?
When you reorder maps, the system:

1. **Identifies Changes**
   - Only maps between old and new position are affected
   - If you move position 3→1, maps 1, 2, and 3 are updated
   - Other maps remain untouched

2. **Updates Database**
   - New `display_order` values calculated
   - Updates sent sequentially (50ms delay between requests)
   - Prevents server overload

3. **Refreshes UI**
   - Table re-renders with new order numbers
   - Affected rows highlighted briefly
   - Ready for next operation

### Performance Optimization
- **Example 1**: 8 maps total, move position 8→1
  - Only 8 maps updated (not optimized at extremes)
  - Sequential requests prevent rate limiting

- **Example 2**: 8 maps total, move position 5→6
  - Only 2 maps updated (highly optimized)
  - Fast operation, minimal server load

### API Endpoint Used
```
PUT /admin/api/maps/{id}
```

Request body:
```json
{
  "display_order": 1
}
```

Response:
```json
{
  "ok": true,
  "message": "Map updated successfully",
  "data": { ... }
}
```

## Best Practices

### ✅ Do's
- Drag from the handle (⋮⋮) icon
- Wait for the green highlight to fade before dragging again
- Use for organizing seasonal or themed maps
- Combine with manual order editing for fine-tuning

### ❌ Don'ts
- Don't drag from other cells (only the handle works)
- Don't drag while notification is showing
- Don't refresh page during drag operation
- Don't use in slow network conditions (wait for confirmation)

## Troubleshooting

### Issue: Drag handle not working
**Solution**: 
- Ensure you're clicking on the ⋮⋮ icon, not the entire row
- Try refreshing the page (Ctrl+R)
- Check browser console (F12) for errors

### Issue: Changes not saving
**Solution**:
- Check network tab in DevTools for failed requests
- Verify you're logged in as admin
- Look for red error notification
- Try again after error notification disappears

### Issue: Getting "Too many requests" error
**Solution**:
- Wait 15 minutes (rate limit window)
- Note: This should not happen with current limits (300/15min)
- Contact admin if persistent

### Issue: Toast notifications not appearing
**Solution**:
- Check browser console for JavaScript errors
- Clear browser cache and refresh
- Ensure JavaScript is enabled
- Try different browser

## Database Changes

### New Endpoint
```
GET /admin/api/visits-by-date?date=YYYY-MM-DD
```
Returns visit analytics for specific date:
```json
{
  "ok": true,
  "date": "2025-12-11",
  "totalVisits": 14,
  "data": [
    {
      "level_name": "SKYNOVAbyNOVA",
      "visit_count": "7",
      "visit_date": "2025-12-11"
    }
  ]
}
```

### No Schema Changes Required
- Uses existing `display_order` column
- Compatible with previous versions
- No migrations needed

## Files Modified

### Frontend
- `/api/public/dashboard.html` - Added drag handle column
- `/api/public/dashboard.js` - Drag & drop logic, notifications
- `/api/public/styles.css` - Visual styles for drag & drop

### Backend
- `/api/index.js` - Improved rate limiting, new endpoint

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| IE 11 | ❌ Not supported |

## Performance Notes

- **Animation**: 150ms drag animation
- **Auto-save Delay**: Immediate (sequential requests with 50ms spacing)
- **Toast Duration**: 3 seconds
- **Highlight Duration**: 2 seconds
- **Network Latency**: Typical 50-100ms per request

## Future Enhancements

Potential improvements for future versions:
- [ ] Undo/Redo functionality
- [ ] Bulk reorder operations
- [ ] Drag & drop for other entities (game servers, online maps)
- [ ] Keyboard shortcuts (arrow keys to move)
- [ ] Custom animation speeds
- [ ] Drag & drop groups/categories

## Support

For issues or questions about drag & drop:
1. Check troubleshooting section above
2. Review browser console (F12 → Console tab)
3. Check network requests (F12 → Network tab)
4. Contact development team with error details

---

**Version**: 4.1.0 | **Last Updated**: December 25, 2025
