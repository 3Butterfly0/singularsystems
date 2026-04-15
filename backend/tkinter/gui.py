import tkinter as tk

# Create a new window
window = tk.Tk()

# Set the window title
window.title("Fit to Content")

# Create a label widget with "Hello World" text
label = tk.Label(window, text="Hello Worlddddddddddddddddddddddddddddd \n" * 10)

# Fit the window to the content
label.pack()

# Center the label
label.place(relx=0.5, rely=0.5, anchor='center')
# give padding to the label
label.config(padx=40, pady=400)

# Start the Tkinter event loop
window.mainloop()