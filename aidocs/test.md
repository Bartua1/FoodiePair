**Shareable Restaurants** A pair could share a restaurant with another pair the view page.
The link should be a new table in our supabase and we should be able to configure what the users with access can do:
    - Leave comments on off
    - Add photos on off
    - Show photos on off
    - Show ratings on off
    - Show comments on off
    - theme (For the future i want the users to be able to choose a style for the page)
    - Users (List of users with access, public if the list is empty)

Implementation steps:
1. Add a share button to the restaurant detail page
2. Add a new table schema for supabase with the specified columns above
3. Add a new page for viewing the shared restaurants, this page should be accessible via a link /shared/[id] (id is the id of the new link table)
4. Create different styles for this page that the user should be able to configure
5. When the user clicks on share they should see a preview of the page and the options to configure it so they can share it with other pairs and actually see how they will see it.
6. Add functionallity to share with other pairs (this will basically add both pair users to the Users in the shared table)
7. Add functionallity to see the shared restaurants in the feed Only if the user is inside of any Users list in the shared table.


**"Wishlist" / "To Go" List:** distinct from "Favorites". A list of places the pair *wants* to go but hasn't visited yet.
When seeing a restaurant sent by another pair the user should have the option to add it to their wishlist.