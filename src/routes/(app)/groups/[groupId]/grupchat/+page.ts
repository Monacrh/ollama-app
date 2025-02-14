export function load({ params }) {
    console.log('groupId:', params.groupId); // Debugging
    return {
        groupId: params.groupId
    };
}
