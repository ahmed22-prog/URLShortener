const input = document.querySelector("input");
const form = document.querySelector("form");
const baseUrl ="http://127.0.0.1:5000";
form.addEventListener("submit",async (event)=>{ 
event.preventDefault();
const data={fullUrl: input.value.trim()};
console.log(input.value);

try {
  const response = await fetch(`${baseUrl}/shortUrl`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
  });

  if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result = await response.json();
  console.log("Shortened URL:", result);
  showResults(result);
} 
catch (error) {
  console.error("Fetch error:", error);
}
});
const showResults = (data) => {
  const resultsBox = document.querySelector(".results");
  const expirationInput = document.querySelector("#expirationInput"); 
  const paragraphElement = document.querySelector('p');
  const linkElement = document.querySelector('a');
  const copyButton = document.querySelector('.copy');
  const fullUrl = `${baseUrl}/shortUrls/${data.short}`;
  resultsBox.classList.add('show');
  paragraphElement.textContent = input.value;
  linkElement.href = fullUrl;
  linkElement.textContent = fullUrl;
  copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(fullUrl);
  alert("Shortened URL copied!");
        });
};

